Meteor.methods({
  
  update: function (collectionName, _id, action) {
    
    var Collection = Mongo.Collection.get(collectionName);
    
	try {
	
	  if (!!Package['aldeed:simple-schema'] && !!Package['aldeed:collection2'] && _.isFunction(Collection.simpleSchema)) {
		
		Collection.update(_id, action, {
		  filter: false,
		  autoConvert: false,
		  removeEmptyStrings: false,
		  validate: false
		});
		
		return;
	  
	  }
	  
	  Collection.update(_id, action);
	  
	}
	
	catch (err) {
	  throw new Meteor.Error(err);	
	}
      
  }
  
});