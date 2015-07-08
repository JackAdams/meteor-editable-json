Meteor.methods({
  
  editableJSON_update: function (collectionName, _id, action) {
    
    var Collection = Mongo.Collection.get(collectionName),
        updated = 0;
    
    try {
    
      if (!!Package['aldeed:simple-schema'] && !!Package['aldeed:collection2'] && _.isFunction(Collection.simpleSchema) && Collection._c2) {
        
        updated = Collection.update(_id, action, {
          filter: false,
          autoConvert: false,
          removeEmptyStrings: false,
          validate: false
        }, function (err, res) {
		  if (err) {
			// console.log(err);  
		  }
		});
      
      }
      
      else {
      
        updated = Collection.update(_id, action, function (err, res) {
		  if (err) {
			// console.log(err);  
		  }
		});
    
      }
      
    }
    
    catch (err) {
      if (!(Meteor.isClient && action.$set && _.keys(action.$set)[0].indexOf('newField') > -1)) {
        throw new Meteor.Error(err);
      }
    }
    
    return updated;
      
  }
  
});