Editable JSON for Meteor - [Demo app](http://meteorpad.com/pad/AphADo6eR4aiJmNzS/Editable%20JSON%20Example) or use [Mongol](http://github.com/msavin/mongol) in your own app (highly recommended)
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

WARNING
===

This is **not** intended for production use. Its purpose is to help build client degugging tools for Meteor developers.