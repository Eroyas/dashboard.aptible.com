import Ember from 'ember';
import {module, test} from 'qunit';
import startApp from '../../helpers/start-app';
import { stubRequest } from '../../helpers/fake-server';

let App;
let stackId = 'my-stack-1';
let orgId = 1;
let url = `/stacks/${stackId}/certificates`;

module('Acceptance: Certificates', {
  beforeEach: function() {
    App = startApp();
    let stack = {
      id: stackId,
      handle: stackId,
      _links: {
        certificates: { href: `/accounts/${stackId}/certificates` },
        organization: { href: `/organizations/${orgId}` }
      }
    };
    stubStacks({}, [stack]);
    stubOrganization();
  },
  afterEach: function() {
    Ember.run(App, 'destroy');
  }
});

test(`visiting ${url} requires authentication`, function() {
  expectRequiresAuthentication(url);
});

test(`visiting ${url} with no certificates shows upload message`, function(assert) {
  stubRequest('get', '/accounts/my-stack-1/certificates', function(){
    return this.success({
      _links: {},
      _embedded: {
        certificates: []
      }
    });
  });

  stubRequest('get', '/accounts/my-stack-1/apps', function(){
    return this.success({
      _links: {},
      _embedded: {
        apps: []
      }
    });
  });
  stubStacks({ includeApps: false });
  stubStack({ id: stackId });

  signInAndVisit(url);
  andThen(function(){
    assert.equal(currentPath(), 'requires-authorization.enclave.stack.certificates.index');
    assert.equal(find('.activate-notice:contains(has no certificates)').length, 1, 'shows notice of no certificates');
    assert.equal(find('.open-certificate-modal:contains(Upload Certificate)').length, 1, 'Shows upload certificate button');
  });
});

test(`visiting ${url} shows list of certificates`, function(assert) {
  stubRequest('get', `/accounts/${stackId}/certificates`, function(){
    return this.success({
      _links: {},
      _embedded: {
        certificates: [
          { id: 'cert-1', certificate_body: 'cert_body', private_key: 'private_key', common_name: 'common_name' },
          { id: 'cert-2', certificate_body: 'cert_body2', private_key: 'private_key2', common_name: 'common_name2' }
        ]
      }
    });
  });

  signInAndVisit(url);

  andThen(function() {
    assert.equal(find('.panel.certificate').length, 2, '2 certificates');
  });
});
