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

EditableJSONInternal.update = function(tmpl,modifier,action) {
  var collectionName = tmpl.get('collection');
  if (!action) {
    var action = {};
    var mod = {};
    mod[modifier.field] = modifier.value;
    action[modifier.action] = mod;
  }
  if (collectionName) {
    var doc = EditableJSONInternal.getContext();
    // Mongo.Collection.get(collectionName).update({_id:doc._id},action);
    Meteor.call('update', collectionName, doc._id, action);
  }
  else {
    _.each(action, function(modifier,action) {
      var fieldName = _.keys(modifier)[0];
      var value = modifier[fieldName];
      switch (action) {
        case '$set' :
          Session.setJSON('editableJSON' + EditableJSONInternal.store(tmpl.get('store')) + '.' + fieldName, value);
          break;
        case '$unset' :
          Session.setJSON('editableJSON' + EditableJSONInternal.store(tmpl.get('store')) + '.' + fieldName, undefined);
          break;
      }
    });
  }
}

EditableJSONInternal.store = function(storeName) {
  return (storeName) ? '.' + storeName : '';
}

EditableJSON.retrieve = function(storeName) {
  return Session.getJSON('editableJSON' + EditableJSONInternal.store(storeName));
}

Template.editableJSON.created = function() {
  var self = this;
  self.editingField = new ReactiveVar();
  if (self.data && self.data.collection) {
    self.autorun(function() {
      var Collection = Mongo.Collection.get(self.data.collection);
      var doc = Collection.find().count() && self.data.document; // Collection.find().count() is the reactivity trigger
      self.collection = self.data.collection;
      self.document = doc;
    });
	return;
  }
  else if (self.data && self.data.store) {
    self.store = self.data.store;
  }
  var initialValue = ((self.store) ? self.parent().data : self.data) || {};
  Session.setJSON('editableJSON' + EditableJSONInternal.store(self.store), initialValue);
  // To keep the state of which field name is being edited
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
      return {
        field:(field !== '____val') ? currentField : null,
        value:{val:value,fld:fld,field:currentField},
        index:index
      }; 
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
    return (obj.____val !== undefined) || _.size(obj) === (this.index + 1);
  },
  editingField : function() {
    var fieldName = this.toString()
    var fldData = Template.parentData(function (data) { return data && data.fld; });
    var fld = fldData && (fldData.fld + '.' + fieldName) || fieldName;
    var template = Blaze._templateInstance();
    var editingField = template.get('editingField');
    return editingField && (editingField.get() === fld) && fieldName;
  },
  _idStyle: function() {
	return (String(this) === "_id") ? "color:grey;" : "";
  }
});

Template.editable_JSON.events({
  'click .editable-JSON-field-text' : function(evt,tmpl) {
    evt.stopPropagation();
	var fieldName = this.toString();
	if (fieldName === '_id') {
	  return;	
	}
    var elem = $(evt.target).closest('.editable-JSON-field');
    var fldData = Template.parentData(function (data) { return data && data.fld; });
    var field = fldData && (fldData.fld + '.' + fieldName) || fieldName; 
    var editingField = tmpl.get('editingField');
    if (editingField) {
      editingField.set(field);
      Tracker.flush();
      elem.find('input').select();
    }
  },
  'keyup .editable-JSON-field input, focusout .editable-JSON-field input' : function(evt,tmpl) {
    evt.stopPropagation();
    var charCode = evt.which || evt.keyCode;
    if (evt.type === 'keyup') {
      if (charCode === 27) {
        var editingField = tmpl.get('editingField');
        editingField.set(null);
        return;  
      }
      if (charCode !== 13) {
        return;  
      }
    }
    var editingField = tmpl.get('editingField');
    var currentFieldName = editingField.get();
    var parentFieldName = _.initial(currentFieldName.split('.'));
    var editedFieldName = $(evt.currentTarget).val();
    var rejoinedParentFieldName = parentFieldName.join('.');
    var newFieldName = ((rejoinedParentFieldName) ? rejoinedParentFieldName + '.' : '') + editedFieldName;
    if (newFieldName !== currentFieldName) {
      var modifier1 = {};
      modifier1[currentFieldName] = 1;
      var action = {
        "$unset" : modifier1
      };
      if (editedFieldName) {
        var modifier2 = {};
        modifier2[newFieldName] = tmpl.data[this.toString()];  
        action["$set"] = modifier2
      }
      
      EditableJSONInternal.update(tmpl,null,action);
    }
    editingField.set(null);
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
         value: newDate,
         action: "$set"
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
      value: !this.valueOf(),
      action: "$set"
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
    if (this.number && !/^\d+$/.test(val)) {
      // If it's not a number, just revert the value and return
      $(evt.target).val(this.value);
      return;    
    }
    Session.setJSON('editableJSON' + EditableJSONInternal.store(tmpl.get('store')) + '.' + this.field, (this.number) ? parseInt(val) : val);
  }
});