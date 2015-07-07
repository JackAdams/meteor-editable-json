EditableJSON = {};

EditableJSON._afterUpdateCallbacks = [];

EditableJSON._runCallbacks = function () {
  // arguments should be:
  // arguments[0] = EditableJSON._afterUpdateCallbacks; // i.e. the array of callback functions to call
  // arguments[1] = context; // i.e. the thing that will be `this` in the function that gets called
  // arguments[2 ...] = arguments; // i.e. the arguments of the function that will be called
  var args = Array.prototype.slice.call(arguments);
  var callbackArray = args.shift();
  var context = args.shift();
  _.each(callbackArray, function (c) {
	if (_.isUndefined(c.store) || c.store === args[0]) {
      c.callback.apply(context,args);
	}
  });
}

EditableJSON.afterUpdate = function (callback, store) {
  EditableJSON._afterUpdateCallbacks.push({callback: callback, store: store});
};

EditableJSONInternal = {};

EditableJSONInternal.timer = null;

EditableJSONInternal.resize = function (elem) {
  var el = $(elem);
  EditableJSONInternal.editing_key_press.fakeEl.text(el.val());
  var width = EditableJSONInternal.editing_key_press.fakeEl.width() + 8;
  el.width(width);
  el.css('min-width',width);    
}

EditableJSONInternal.editing_key_press = function (elem,noDelay) {
  if (EditableJSONInternal.editing_key_press.fakeEl === undefined) {
    EditableJSONInternal.editing_key_press.fakeEl = $('<span class="editable-JSON-input">').hide().appendTo(document.body);
  }
  if (noDelay) {
    var input = elem.find('input');
    EditableJSONInternal.resize(input);
    input.select();
  }
  else {
    Meteor.defer(function () {
      EditableJSONInternal.resize(elem);
    });
  }
}

EditableJSONInternal.getContext = function () {
  var jsonTemplateData = Template && Template.parentData(function (data) { return _.isObject(data) && data.document; });
  var data = jsonTemplateData && jsonTemplateData.document;
  return data || {};
}

EditableJSONInternal.getField = function () {
  var field = Blaze._parentData(1).fld;
  return (!(EditableJSON.disableIdField && field === '_id')) && field;  
}

EditableJSONInternal.makeEmptyType = function (item) {
  var tests = [
    [_.isDate(item), new Date()],
	[_.isArray(item), []],
	[_.isObject(item), {}],
	[_.isNull(item), null],
	[_.isBoolean(item), false],
	[_.isNumber(item), 0]
  ]
  var pass = _.find(tests, function (t) {
    return t[0]; 
  });
  if (pass) {
	return pass[1];  
  }
  return '';
}

EditableJSONInternal.update = function (tmpl, modifier, action) {
  var collectionName = tmpl.get('collection');
  if (!action) {
    var action = {};
    var mod = {};
    mod[modifier.field] = modifier.value;
    action[modifier.action] = mod;
  }
  if (collectionName) {
    // Validate -- make sure the change isn't on the id field
    // And make sure we're not modifying the same field twice
    var okay = true;
    var conflict = false;
    var modFields = [];
    _.each(action, function (modifier, action) {
      if (_.has(modifier,'_id')) {
        okay = false;    
      }
      var field = _.keys(modifier)[0];
      if (!_.contains(modFields, field)) {
        // The following prevents all errors, but is too restrictive
        // && !_.find(modFields,function (f){ return field.indexOf(f) !== -1; })
        modFields.push(field);
      }
      else {
        conflict = true;  
      }
    });
    if (!okay) {
      if (EditableJSON.disableIdField) {
        console.log("You can't change the _id field.");
      }
      return;  
    }
    if (conflict) {
      console.log("You can't use conflicting modifiers.");
      return;    
    }
    var doc = EditableJSONInternal.getContext();
    Meteor.call('editableJSON_update', collectionName, doc._id, action, function (err, res) {
      if (err) {
        console.log("You can't use conflicting modifiers."); // We're making a big assumption here in giving this message -- TODO -- actually check the message
        console.log(err);
      }
	  else {
		if (res && _.isFunction(EditableJSON.afterUpdate)) {
		  var mutatedDoc = Mongo.Collection.get(collectionName).findOne({_id: doc._id});
		  EditableJSON._runCallbacks(EditableJSON._afterUpdateCallbacks, mutatedDoc, collectionName, action, doc, res);
		}
	  }
    });
  }
  else {
	var JSONbefore = Session.getJSON('editableJSON' + EditableJSONInternal.store(tmpl.get('store')));
    _.each(action, function (modifier, action) {
      var fieldName = _.keys(modifier)[0];
      var value = modifier[fieldName];
      switch (action) {
        case '$set' :
          Session.setJSON('editableJSON' + EditableJSONInternal.store(tmpl.get('store')) + '.' + fieldName, value);
          break;
        case '$unset' :
          Session.setJSON('editableJSON' + EditableJSONInternal.store(tmpl.get('store')) + '.' + fieldName, undefined);
          break;
		case '$push' :
		  var arr = Session.getJSON('editableJSON' + EditableJSONInternal.store(tmpl.get('store')) + '.' + fieldName);
		  arr.push(value);
		  Session.setJSON('editableJSON' + EditableJSONInternal.store(tmpl.get('store')) + '.' + fieldName, arr);
		  break;
		case '$pull' :
		  var arr = Session.getJSON('editableJSON' + EditableJSONInternal.store(tmpl.get('store')) + '.' + fieldName);
		  _.reduce(arr, function (memo, item) {
			if (!_.isEqual(value, item)) {
			  memo.push(item);
			}
			return memo;
		  },[]);
		  Session.setJSON('editableJSON' + EditableJSONInternal.store(tmpl.get('store')) + '.' + fieldName, arr);
      }
    });
	var JSONafter = Session.getJSON('editableJSON' + EditableJSONInternal.store(tmpl.get('store')));
	EditableJSON._runCallbacks(EditableJSON._afterUpdateCallbacks, JSONafter, tmpl.get('store'), action, JSONbefore, 1);
  }
}

EditableJSONInternal.saveToSession = function (evt, tmpl, self, noDelay) {
  var elem = tmpl.$(evt.target);
  var val = elem.val();
  if (self.number && !/^(\-|\+)?([0-9]+(\.[0-9]+)?|Infinity)$/.test(val)) {
    // If it's not a number, just revert the value and return
    elem.val(self.value);
    return;    
  }
  var field = 'editableJSON' + EditableJSONInternal.store(tmpl.get('store')) + '.' + self.field;
  var value = (self.number) ? parseFloat(val) : val;
  var JSONbefore = Session.getJSON('editableJSON' + EditableJSONInternal.store(tmpl.get('store')));
  var fireCallback = function () {
	// Sort out callback values
	var JSONafter = Session.getJSON('editableJSON' + EditableJSONInternal.store(tmpl.get('store')));
	var mod = {};
	mod[field] = value;
	var action = {$set: mod};
	EditableJSON._runCallbacks(EditableJSON._afterUpdateCallbacks, JSONafter, tmpl.get('store'), action, JSONbefore, 1);
  }
  if (noDelay) {;
    Session.setJSON(field, value);
	fireCallback();
  }
  else {
    if (!self.collection) {
      if (EditableJSONInternal.timer) {
        Meteor.clearTimeout(EditableJSONInternal.timer);    
      }
      EditableJSONInternal.timer = Meteor.setTimeout(function () {
        Session.setJSON(field, value);
		// fireCallback();
		// This is firing for each keypress that is more than 300ms apart
		// Even though it's being updated, maybe we should hold off until
		// user explicitly finishes entering the new value
      },300);
    }
  }
}

EditableJSONInternal.handleDoubleClick = function (evt, tmpl) {
  evt.stopPropagation();
  evt.stopImmediatePropagation();
  var editingField = tmpl.get('editingField');
  if (editingField) {
	editingField.set(null);	
  }
  Tracker.flush();
  console.log("tmpl.data:",tmpl.data); // tmpl.data has the whole data context, including the field we want
  console.log("this:", this); // this.value has an object with fld (full path through object), field (deepest field) and val, which is the value for the field
  // Need to check on type of this.value.val and decide if we're adding to an array or an object
  var self = this;
  var type = (_.isArray(self.value.val)) ? 'array' : ((_.isObject(self.value.val) && !_.isDate(self.value.val)) ? 'object' : null);
  if (!type) {
	return;
  }
  var sample = (type === 'array') ? self.value.val[0] : _.values(self.value.val)[0];
  var newValue = EditableJSONInternal.makeEmptyType(sample); 
  var fieldName = _.keys(self.value.val)[0] || 'newField';
  /*var fldData = Template.parentData(function (data) { return data && data.fld; });
  var field = fldData && (fldData.fld + '.' + fieldName) || fieldName;
console.log("fldData:",fldData);*/
  // We now add a new field
  var path = self.value && self.value.fld || '';
  var number = '';
  while (type === 'object' && !_.isUndefined(self.value.val[fieldName + number])) {
	number++;  
  }
  var newFieldName = fieldName + number;
  var modifier = {
	field: self.value.fld + (self.value.fld && ((type === 'object') ? '.' : '') || '') + ((type === 'object') ? (newFieldName) : ''),
	value: newValue,
	action: (type === 'array') ? "$push" : "$set"
  }
  console.log("MODIFIER:",modifier);
  EditableJSONInternal.update(tmpl, modifier);
  // Make the new automatically field selected for editing
  Meteor.defer(function () {
    var newFieldElem = tmpl.$(evt.target).find('.editable-JSON-field-text').filter(function(){ return $(this).text() === newFieldName;});
	if (tmpl.data.collection && !newFieldElem.length) {
	  alert("Are you sure you the new field ['" + newFieldName + "'] is published?");
	}
	else {
	  newFieldElem.trigger('click');
	}
  });
}

EditableJSONInternal.store = function (storeName) {
  return (storeName) ? '.' + storeName : '';
}

EditableJSON.retrieve = function (storeName) {
  return Session.getJSON('editableJSON' + EditableJSONInternal.store(storeName));
}

Template.editableJSON.created = function () {
  var self = this;
  self.editingField = new ReactiveVar();
  if (self.data && self.data.collection) {
    self.autorun(function () {
      var Collection = Mongo.Collection.get(self.data.collection);
      var doc = Collection && Collection.find().count() && self.data.document; // Collection.find().count() is the reactivity trigger
      self.collection = self.data.collection;
      self.document = doc || {};
    });
    return;
  }
  else if (self.data && self.data.store) {
    self.store = self.data.store;
  }
  var explicitData = (!_.isUndefined(self.data.observe)) ? self.data.observe : self.data.json;
  var initialValue = (!_.isUndefined(explicitData)) ? explicitData : (((self.store) ? self.parent().data : self.data) || {});
  Session.setJSON('editableJSON' + EditableJSONInternal.store(self.store), initialValue);
  if (self.data.observe) {
	self.watcher = new Tracker.Dependency;
	this.autorun(function () {
	  // watcher is watching for external changes
	  self.watcher.depend();
	  Meteor.defer(function () {
		var newJSON = (!_.isUndefined(self.data.observe)) ? self.data.observe : (((self.store) ? self.parent().data : self.data) || {});
		Session.setJSON('editableJSON' + EditableJSONInternal.store(self.store), newJSON);
	  });
	});
  }
}

Template.editableJSON.helpers({
  watcher: function () {
	Template.instance().watcher.changed();  
  },
  json: function () {
	return this.json || Template.instance().data;  
  }
});

Template.editableJSON.events({
  'dblclick .editable-JSON-click-zone' : function (evt, tmpl) {
	// We need to fake a data context to allow addition of top level fields
	var context = {
	  field: '',
	  value: {
		val: this.document || this.json || this.observe || tmpl.data,
		field: '',
		fld: ''  
	  }
	}
	EditableJSONInternal.handleDoubleClick.call(context, evt, tmpl); 
  }
});

Template.editable_JSON.helpers({
  fields: function () {
    var self = this;
    var index = -1;
	var arrayComma = self.arrayComma || false;
    if (_.has(self,'____val')) {
      index = self.arrIndex - 1;
      delete self.arrIndex;
	  delete self.arrayComma;
    }
    var fields = _.map(self, function (value, field) {
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
        value:{val: value, fld: fld, field: currentField, arrayComma: arrayComma},
        index:index
      }; 
    });
    return fields;
  },
  value: function () {
    return (_.isObject(this.value) && _.has(this.value, '____val')) ? this.value.____val : this.value;  
  },
  isArray: function () {
    return _.isArray(this.val); 
  },
  isObject: function () {
    return _.isObject(this.val);
  },
  isString: function () {
    return _.isString(this.val);
  },
  isBoolean: function () {
    return _.isBoolean(this.val);  
  },
  isDate: function () {
    return _.isDate(this.val);  
  },
  isNumber: function () {
    return _.isNumber(this.val);  
  },
  isNull : function () {
    return _.isNull(this.val);  
  },
  last: function (obj) {
    return (obj.____val !== undefined) || _.size(obj) === (this.index + 1);
  },
  editingField : function () {
    var fieldName = this.toString()
    var fldData = Template.parentData(function (data) { return data && data.fld; });
    var fld = fldData && (fldData.fld + '.' + fieldName) || fieldName;
    var template = Blaze._templateInstance();
    var editingField = template.get('editingField');
    return editingField && (editingField.get() === fld) && fieldName;
  },
  _idClass: function () {
    return (String(this) === "_id") ? "editable-JSON-_id-field" : "";
  }
});

Template.editable_JSON.events({
  'click .editable-JSON-field' : function (evt, tmpl) {
    tmpl.$(evt.target).find('.editable-JSON-field-text').trigger('click');
  },
  'click .editable-JSON-field-text' : function (evt,tmpl) {
    evt.stopPropagation();
    var fieldName = this.toString();
    if (fieldName === '_id') {
      return;    
    }
    var elem = $(evt.target).closest('.editable-JSON-field');
    var fldData = Template.parentData(function (data) { return data && data.fld; });
    var field = fldData && (fldData.fld + '.' + fieldName) || fieldName;
	if (evt.type === 'click') { 
    var editingField = tmpl.get('editingField');
	  if (editingField) {
		editingField.set(field);
		Tracker.flush();
		EditableJSONInternal.editing_key_press(elem,true);
	  }
	}
  },
  'dblclick .editable-JSON-click-zone' : function (evt, tmpl) {
	EditableJSONInternal.handleDoubleClick.call(this, evt, tmpl); 
  },
  'keydown .editable-JSON-field input, focusout .editable-JSON-field input' : function (evt, tmpl) {
    evt.stopPropagation();
    var charCode = evt.which || evt.keyCode;
    if (evt.type === 'keydown') {
      if (charCode === 27) {
        var editingField = tmpl.get('editingField');
        editingField.set(null);
        return;  
      }
      if (charCode !== 13) {
        EditableJSONInternal.editing_key_press($(evt.target));
        return;  
      }
    }
    var editingField = tmpl.get('editingField');
    var currentFieldName = editingField.get();
	if (!currentFieldName) {
	  return;	
	}
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
      EditableJSONInternal.update(tmpl, null, action);
    }
    editingField.set(null)
  }
});

Template.editable_JSON_object.helpers({
  notEmpty: function () {
    return !_.isEmpty(this);  
  }
});

Template.editable_JSON_array.helpers({
  elements: function () {
	var self = this;
	var lastIndex = self.length - 1;
	var elements = _.map(this, function (value, index) {
	  var arrayComma = (index !== lastIndex) ? true : false;
	  return {element:{____val: value, arrIndex: index, arrayComma: arrayComma}, index: index};
	});
    return elements;
  },
  last: function (arr) {
    return arr.length === (this.index + 1);
  }
});

Template.editable_JSON_string.helpers({
  _idField: function () {
    var parentData = Template.parentData(1);
    return parentData && parentData.fld && parentData.fld === '_id';
  }
});

Template.editable_JSON_string.events({
  'click .editable-JSON-string' : function (evt, tmpl) {
    tmpl.$(evt.target).find('.editable-JSON-edit').trigger('click');
  }
});

Template.editable_JSON_number.events({
  'click .editable-JSON-number' : function (evt, tmpl) {
    tmpl.$(evt.target).find('.editable-JSON-edit').trigger('click');
  }
});

/*Template.editable_JSON_date.rendered = function () {
  var self = this;
  var field = this.$('input')[0];
  var picker = new Pikaday({
    field: field,
    onSelect: function (date) {
      field.value = picker.toString();
    }
  });
}*/

Template.editable_JSON_date.helpers({
  date: function () {
    return this.toISOString();
  }
});

Template.editable_JSON_date.events({
  'change input' : function (evt, tmpl) {
     var currentDate = new Date(this);
     var newDate = new Date(tmpl.$('input').val());
     if (currentDate.getTime() !== newDate.getTime()) {
       var modifier = {
         field: EditableJSONInternal.getField(),
         value: newDate,
         action: "$set"
       }
       EditableJSONInternal.update(tmpl, modifier);
    }
  }
});

Template.editable_JSON_boolean.helpers({
  boolean: function () {
    return (this.valueOf() == true) ? 'true' : 'false';
  }
});

Template.editable_JSON_boolean.events({
  'click .editable-JSON-boolean' : function (evt,tmpl) {
    var modifier = {
      field: EditableJSONInternal.getField(),
      value: !this.valueOf(),
      action: "$set"
    };
    EditableJSONInternal.update(tmpl,modifier);  
  }
});

Blaze.registerHelper('editable_JSON_getField', function () {
  return EditableJSONInternal.getField();
});

Blaze.registerHelper('editable_JSON_getContext', function () {
  return EditableJSONInternal.getContext();
});

Blaze.registerHelper('editable_JSON_collection', function () {
  var template = Blaze._templateInstance();
  var collection = template.get('collection');
  return collection;
});

Template.editableJSONInput.created = function () {
  this.editing = new ReactiveVar(false);
}

Template.editableJSONInput.helpers({
  editing: function () {
    return Blaze._templateInstance().editing.get();
  }
});

Template.editableJSONInput.events({
  'click .editable-JSON-edit' : function (evt, tmpl) {
    evt.stopPropagation();
    if (EditableJSON.disableIdField && String(this) === '_id') {
      return;
    }
    var parent = $(evt.target).parent();
    tmpl.editing.set(true);
    Tracker.flush();
    EditableJSONInternal.editing_key_press(parent, true);
  },
  /*'input input' : function (evt, tmpl) {
    EditableJSONInternal.saveToSession(evt, tmpl, this);
  },*/
  'keydown input' : function (evt, tmpl) {
    var charCode = evt.which || evt.keyCode;
    if (charCode === 27) {
      tmpl.editing.set(false);  
    }
    if (charCode !== 13) {
      EditableJSONInternal.editing_key_press(tmpl.$(evt.target));
    }
  },
  'keyup input, focusout input' : function (evt, tmpl) {
    if (evt.type === 'keyup') {
      var charCode = evt.which || evt.keyCode;
      if (charCode !== 13) {
        return;  
      }
    }
    tmpl.editing.set(false);
    if (this.collection) {
      var elem = tmpl.$(evt.target);
      var value = elem.val();
      if (this.number) {
        value = parseFloat(value);  
      }
      if (value !== this.value) {
        var modifier = {
          field: this.field,
          value: value,
          action: "$set"
        };
        EditableJSONInternal.update(tmpl, modifier);
      }
    }
    else {
      EditableJSONInternal.saveToSession(evt, tmpl, this, true);    
    }
  }
});