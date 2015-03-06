EditableJSON = {};
EditableJSONInternal = {};

EditableJSONInternal.getContext = function() {
  var jsonTemplateData = Template.parentData(function (data) { return _.isObject(data) && data.document; });
  return jsonTemplateData.document;
}

EditableJSONInternal.getField = function() {
  var field = Blaze._parentData(1).fld;
  return (field !== '_id') && field;
}

EditableJSONInternal.update = function(tmpl,modifier) {
  var collectionName = tmpl.get('collection');
  if (collectionName) {
	var doc = EditableJSONInternal.getContext();
	var mod = {};
	mod[modifier.field] = modifier.value;
	Meteor.Collection.get(collectionName).update({_id:doc._id},{$set:mod});
  }
  else {
	Session.setJSON('editableJSON' + EditableJSONInternal.store(tmpl.get('store')) + '.' + modifier.field, modifier.value);  
  }
}

EditableJSONInternal.store = function(storeName) {
  return (storeName) ? '.' + storeName : '';
}

EditableJSON.retrieve = function(storeName) {
  return Session.getJSON('editableJSON' + EditableJSONInternal.store(storeName));
}
Template.editableJSON.rendered = function() {
  var self = this;
  if (self.data && self.data.collection) {
	self.autorun(function() {
	  var Collection = Meteor.Collection.get(self.data.collection);
	  var doc = Collection.find().count() && self.data.document && Collection.findOne({_id: self.data.document._id}); // Collection.find().count() is the reactivity trigger
      self.collection = self.data.collection;
      self.document = doc;
	});
  }
  else if (self.data && self.data.store) {
	self.store = self.data.store;  
  }
}

Template.editableJSON.helpers({
  json: function() {
    if (this.collection && this.document) {
      return this.document;  
    }
    if (this.json) {
	  var val = this.json;	
	}
	else {
	  var val = this || {};
	}
	if (!Session.getJSON('editableJSON' + EditableJSONInternal.store(this.store))) {
	  Session.setJSON('editableJSON' + EditableJSONInternal.store(this.store),val);
	}
	return Session.getJSON('editableJSON' + EditableJSONInternal.store(this.store));
  }
});

Template.editable_JSON.helpers({
  fields: function() {
    var self = this;
    var index = -1;
    // console.log("Object:",self);
    if (_.has(self,'____val')) {
      index = self.arrIndex - 1;
      delete self.arrIndex;
    }
    var fields = _.map(self,function(value,field) {
    index++;
    var parent = null;
    var number = 2;
    while (Blaze._parentData(number) && Blaze._parentData(number)._id === undefined && Blaze._parentData(number).fld === undefined) {
      number++;  
    }
    parent = Blaze._parentData(number); // console.log("Field",field);console.log("Value:",value);console.log("parent:",parent);console.log("Index:",index);
    var currentField = (field !== '____val') ? field : index;
    var fld = (parent && parent.fld) ? parent.fld + ((currentField !== undefined) ? '.' + currentField : '') : currentField;
    return {field:(field !== '____val') ? currentField : null,value:{val:value,fld:fld,field:currentField},index:index}; 
  });
    return fields;
  },
  value: function() {
    return (_.isObject(this.value) && _.has(this.value,'____val')) ? this.value.____val : this.value;  
  },
  isArray: function() {
    return _.isArray(this.val); 
  },
  isObject: function() {
    return _.isObject(this.val);
  },
  isString: function() {
    return _.isString(this.val);
  },
  isBoolean: function() {
    return _.isBoolean(this.val);  
  },
  isDate: function() {
    return _.isDate(this.val);  
  },
  isNumber: function() {
    return _.isNumber(this.val);  
  },
  last: function(obj) { // console.log("obj:",obj);console.log("this:",this);console.log("Last:",_.size(obj) === (this.index + 1));
    return obj.____val || _.size(obj) === (this.index + 1);
  }
});

Template.editable_JSON_array.helpers({
  elements: function() {
  var elements = _.map(this,function(value,index) {
    return {element:{____val:value,arrIndex:index},index:index};
  }); // console.log("Elements:",elements);
    return elements;
  },
  last: function(arr) { // console.log("arr:",arr);console.log("this:",this);console.log("Last:",arr.length === (this.index + 1));
    return arr.length === (this.index + 1);
  }
});

Template.editable_JSON_date.rendered = function() {
  var self = this;
  var field = this.$('input')[0];
  var picker = new Pikaday({
	field: field,
    onSelect: function(date) {
	  field.value = picker.toString();
    }
  });
}

Template.editable_JSON_date.helpers({
  date: function() {
    return this.toISOString();
  }
});

Template.editable_JSON_date.events({
  'change input' : function(evt,tmpl) {
	 var modifier = {
	   field: EditableJSONInternal.getField(),
	   value: new Date(tmpl.$('input').val())
	 }
	 EditableJSONInternal.update(tmpl,modifier);
  }
});

Template.editable_JSON_boolean.helpers({
  boolean: function() {
    return (this.valueOf() === true) ? 'true' : 'false';
  }
});

Template.editable_JSON_boolean.events({
  'click .editable-JSON-boolean' : function(evt,tmpl) {
	var modifier = {
	  field: EditableJSONInternal.getField(),
	  value: !this.valueOf()
	};
	EditableJSONInternal.update(tmpl,modifier);  
  }
});

Blaze.registerHelper('editable_JSON_getField', function() { // console.log(this.toString()); console.log("parent1:",Blaze._parentData(1)); console.log("parent2:",Blaze._parentData(2)); console.log("parent3:",Blaze._parentData(3)); console.log("parent4:",Blaze._parentData(4)); console.log("parent5:",Blaze._parentData(5)); console.log("parent6:",Blaze._parentData(6)); console.log("parent7:",Blaze._parentData(7)); console.log("parent8:",Blaze._parentData(8));
  return EditableJSONInternal.getField();
});

Blaze.registerHelper('editable_JSON_getContext', function() {
  return EditableJSONInternal.getContext();
});

Blaze.registerHelper('editable_JSON_collection', function() {
  var template = Blaze._templateInstance();
  var collection = template.get('collection');
  return collection;
  // var jsonTemplateData = Template.parentData(function (data) { return _.isObject(data) && data.collection; });
  // return jsonTemplateData.collection || null;
});

Template.editableJSONInput.events({
  'input input' : function(evt,tmpl) {
    var val = tmpl.$(evt.target).val();
	Session.setJSON('editableJSON' + EditableJSONInternal.store(tmpl.get('store')) + '.' + this.field, val);
  }
});