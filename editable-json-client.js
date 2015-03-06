EditableJSON = {};
EditableJSONInternal = {};

EditableJSONInternal.getContext = function() {
  var jsonTemplateData = Template && Template.parentData(function (data) { return _.isObject(data) && data.document; });
  var data = jsonTemplateData && jsonTemplateData.document;
  return data || {};
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
	  var doc = Collection.find().count() && self.data.document; // Collection.find().count() is the reactivity trigger
      self.collection = self.data.collection;
      self.document = doc;
	});
  }
  else if (self.data && self.data.store) {
	self.store = self.data.store;
  }
  Session.setJSON('editableJSON' + EditableJSONInternal.store(self.store), ((self.store) ? self.parent().data : self.data) || {});
}

Template.editableJSON.helpers({
  json: function() {
    if (this.collection && this.document) {
      return this.document;  
    }
    if (this.json) {
	  var currentData = Session.getJSON('editableJSON' + EditableJSONInternal.store(this.store));
	  if (!currentData || _.isEmpty(currentData)) {
		Session.setJSON('editableJSON' + EditableJSONInternal.store(this.store),this.json);
	  }
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
    parent = Blaze._parentData(number);
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
  last: function(obj) {
    return obj.____val || _.size(obj) === (this.index + 1);
  }
});

Template.editable_JSON_array.helpers({
  elements: function() {
  var elements = _.map(this,function(value,index) {
    return {element:{____val:value,arrIndex:index},index:index};
  });
    return elements;
  },
  last: function(arr) {
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
	 var currentDate = new Date(this);
	 var newDate = new Date(tmpl.$('input').val());
	 if (currentDate.getTime() !== newDate.getTime()) {
       var modifier = {
	     field: EditableJSONInternal.getField(),
	     value: newDate 
       }
	   EditableJSONInternal.update(tmpl,modifier);
    }
  }
});

Template.editable_JSON_boolean.helpers({
  boolean: function() {
    return (this.valueOf() == true) ? 'true' : 'false';
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

Blaze.registerHelper('editable_JSON_getField', function() {
  return EditableJSONInternal.getField();
});

Blaze.registerHelper('editable_JSON_getContext', function() {
  return EditableJSONInternal.getContext();
});

Blaze.registerHelper('editable_JSON_collection', function() {
  var template = Blaze._templateInstance();
  var collection = template.get('collection');
  return collection;
});

Template.editableJSONInput.events({
  'input input' : function(evt,tmpl) {
    var val = tmpl.$(evt.target).val();
	if (this.number && !(!isNaN(parseFloat(val)) && isFinite(val))) {
	  // If it's not a number, just revert the value and return
	  $(evt.target).val(this.value);
	  return;	
	}
	Session.setJSON('editableJSON' + EditableJSONInternal.store(tmpl.get('store')) + '.' + this.field, (this.number) ? parseInt(val) : val);
  }
});