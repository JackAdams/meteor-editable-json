Meteor.methods({
  
  update: function (collectionName, _id, action) {
    
    var Collection = Mongo.Collection.get(collectionName),
        updated = 0;
    
    try {
    
      if (!!Package['aldeed:simple-schema'] && !!Package['aldeed:collection2'] && _.isFunction(Collection.simpleSchema) && Collection._c2) {
        
        updated = Collection.update(_id, action, {
          filter: false,
          autoConvert: false,
          removeEmptyStrings: false,
          validate: false
        });
      
      }
      
      else {
      
        updated = Collection.update(_id, action);
    
      }
      
    }
    
    catch (err) {
      throw new Meteor.Error(err);    
    }
    
    return updated;
      
  }
  
});