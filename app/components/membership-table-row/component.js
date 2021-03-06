import Ember from 'ember';

export default Ember.Component.extend({
  classNames: ['aptable__member-row'],
  tagName: 'tr',
  busy: false,
  user: Ember.computed.reads('membership.user'),
  memberUserRoles: Ember.computed.reads('membership.user.roles'),
  currentUserRoles: Ember.computed.reads('authorizationContext.currentUserRoles'),
  organization: Ember.computed.reads('authorizationContext.organization'),
  billingDetail: Ember.computed.reads('authorizationContext.billingDetail'),

  privilegedMemberships: Ember.computed.filterBy('role.memberships', 'privileged', true),

  isOnlyRole: Ember.computed('membership.user', 'memberUserRoles.[]', function() {
    return this.get('memberUserRoles.length') === 1;
  }),

  hasOwnerShield: Ember.computed('membership.user', 'memberUserRoles.[]', function() {
    return this.isRoleOwner(this.get('user'), this.get('memberUserRoles'));
  }),

  removeTooltip: Ember.computed('organization.name', 'membership.user', 'memberUserRoles.[]', 'organization.securityOfficer.id', 'billingDetail.billingContact.id', function() {
    if (!this.get('isOnlyRole')) {
      return "Remove role membership";
    }
    return `${this.get('user.name')} must be assigned to another role before
      they can be removed from ${this.get('role.name')}.`;
  }),

  linkToEditMember: Ember.computed('authorizationContext.currentUserRoles.[]', function() {
    return this.get('isOnlyRole') && this.get('authorizationContext.userIsOrganizationAdmin');
  }),

  // Account | Enclave | Gridiron Owners effectively have admin privileges,
  // so it gets toggled and disabled.
  isPrivilegedMember: Ember.computed('membership.privileged', 'memberUserRoles.[]', function() {
    //return this.isRoleOwner(this.get('membership.user'), this.get('memberUserRoles')) ||
    return this.get('membership.privileged');
  }),

  isToggleDisabled: Ember.computed('memberUserRoles.[]', 'authorizationContext.currentUserRoles.[]', function() {
    if (this.get('role.isOwner')) { return true; }

    // Disable if current user is not a platform, compliance, or account owner
    if (!this.isRoleOwner(this.get('authorizationContext.currentUser'), this.get('authorizationContext.currentUserRoles'))) {
      return true;
    }
    // If current user is a role owner, check this role member and disable
    // if they are an owner
    return this.isRoleOwner(this.get('membership.user'), this.get('memberUserRoles'));
  }),

  isRoleOwner(user, roles) {
    if (!this.get('user')) { return false; }
    if (user.isAccountOwner(roles, this.get('organization'))) {
      return true;
    }
    if (this.get('role.isCompliance')) {
      return user.isComplianceOwner(roles, this.get('organization'));
    }
    return user.isPlatformOwner(roles, this.get('organization'));
  },

  actions: {
    togglePrivileged(valueOptions) {
      let isOn = !!valueOptions.newValue;
      let membership = this.get('membership');

      if(isOn === membership.get('privileged')) {
        // No need to re-save if value isn't changed
        return;
      }

      // No need to update if this user is an owner.
      if (this.isRoleOwner(membership.get('user'), this.get('memberUserRoles'))) { return; }

      membership.set('privileged', isOn);
      this.set('busy', true);
      membership.save().then(() => { this.set('busy', false); });
    },

    // Confirm deletes, also message that the user will be removed from the
    // org if this is their only role
    destroyMembership() {
      let role = this.get('role');
      let membership = this.get('membership');
      let user = membership.get('user');

      let subject = user.get('name');
      if (user.get('id') === this.get('authorizationContext.currentUser.id')) {
        subject = 'yourself';
      }

      // Confirm...
      let confirmMsg = `\nAre you sure you want to remove ${subject} from ${role.get('name')}?\n`;
      if (!confirm(confirmMsg)) { return false; }

      membership.destroyRecord().then(() => {
        let message = `${user.get('name')} removed from ${role.get('name')}.`;

        this.sendAction('completedAction', message);
        // Ember Data relates users to roles (the membership relationship is inferred),
        // need to remove the user from the role's list of users
        role.get('users').removeObject(user);
        role.get('memberships').removeObject(membership);
        return;
      });
    }
  }
});
