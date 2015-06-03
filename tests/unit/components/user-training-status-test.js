import {
  moduleForComponent,
  test
} from 'ember-qunit';
import Ember from 'ember';

moduleForComponent('user-training-status', {
  needs:['component:compliance-status', 'component:compliance-icon', 'component:gravatar-image']
});

let subject = Ember.Object.create({ data: { links: { self: '/users/1' }} });
let doc = Ember.Object.create({ userUrl: '/users/2',
                                  createdAt: '2015-05-27T17:47:13.287Z',
                                  nextAssessment: '2016-05-27T17:47:13.287Z' });
let criterion = Ember.Object.create({ documents: [doc], scope: 'user' });

test('it renders', function(assert) {
  assert.expect(2);

  var component = this.subject({ user: subject, criterion: criterion });
  assert.equal(component._state, 'preRender');

  this.render();
  assert.equal(component._state, 'inDOM');
});
