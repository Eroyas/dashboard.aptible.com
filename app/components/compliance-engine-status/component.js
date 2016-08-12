import Ember from 'ember';

export default Ember.Component.extend({
  classNames: ['panel', 'panel-default', 'compliance-engine-status', 'resource-list-item'],
  criterion: null,
  documents: null,
  title: Ember.computed.reads('status.criterion.name')
});
