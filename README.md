Editable JSON for Meteor - [Click here for demo app](http://meteorpad.com/pad/AphADo6eR4aiJmNzS/Editable%20JSON%20Example)
===

Quick Start
---

```
meteor add babrahams:editable-json
```

In a template, write:

```
{{> editableJSON}}
```

This will turn the current data context into an editable block of JSON.

After editing _(which won't have any effect on the data context or make any database writes)_, you can retrieve the modified JSON, as a javascript object, with:

```
EditableJSON.retrieve();
```

If you __do__ want immediate updates to a certain document in a certain collection to be persisted in mongo, just write:

```
{{> editableJSON collection="posts" document=post}}
```

where the helper `post` is returning a document from the `posts` collection. Or write `document=this` if the surrounding data context is already a document from the `posts` collection.

More advanced use
---

If you want to explicity pass a javascript object to the widget instead of using the surrounding data context:

```
{{> editableJSON json=myJSObjectFromAHelper}}
```

If you want several widgets operating on the screen at once:

```
{{> editableJSON json=JSObj1 store="custom1"}}
{{> editableJSON json=JSObj2 store="custom2"}}
```

And to retrieve these:

```
var JSObj1 = EditableJSON.retrieve("custom1");
var JSObj2 = EditableJSON.retrieve("custom2");
```

You can add callbacks (that fire on client only).

After updates:
```
EditableJSON.afterUpdate(function (store, action, JSONbefore, documentsUpdated) {
  // Overwrite this function in client side js to create a callback after every edit	
  // `this` in the callback function context is the document or the json AFTER the update
  // `store` is the name of the data store as defined above (it will be `undefined` if not defined)
  // `store` will be the collection name, if you're using the package to do direct updates to Mongo documents
  // `action` is a Mongo update operator -- either `{$set: {field: value}}` or `{$unset: {field: 1}}`
}[, store]);
```

If a newly added field appears to be unpublished:
```
EditableJSON.onUnpublishedFieldAdded(function (collection, field, value) {
  // Overwrite this function in client side js to alert user that they
  // may not be seeing what they expect when adding new fields
  // due to restrictions on the fields being published
});
```

If you include the optional parameter `store` the callback will only fire when the specified store (or collection) is updated, otherwise it will fire on any update to any store/collection.

WARNING
===

This is **not** intended for production use. Its purpose is to help build client debugging tools for Meteor developers.