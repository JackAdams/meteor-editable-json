Package.describe({
  name: 'babrahams:editable-json',
  version: '0.0.2',
  summary: 'Editable JSON for Meteor',
  // URL to the Git repository containing the source code for this package.
  git: 'https://github.com/JackAdams/meteor-editable-json.git',
  // By default, Meteor will default to using README.md for documentation.
  // To avoid submitting documentation, set this field to null.
  documentation: 'README.md'
});

Package.onUse(function(api) {

  api.versionsFrom('1.0.3.2');
 
  api.use(['templating','blaze','spacebars','underscore','jquery'],'client');
  api.use('gwendall:session-json@0.1.7','client');
  api.use('babrahams:editable-text@0.7.14');
  api.use('aldeed:template-extension@3.4.1','client');
  api.use('richsilv:pikaday@1.0.0','client');
  
  api.addFiles('editable-json-common.js');
  api.addFiles('editable-json.css','client');
  api.addFiles('editable-json.html','client');
  api.addFiles('editable-json-client.js','client');
  
  api.export('EditableJSON','client');
  
});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('babrahams:editable-json');
  api.addFiles('editable-json-tests.js');
});
