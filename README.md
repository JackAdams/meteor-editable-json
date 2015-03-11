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

After editing (Note: editing won't have any effect on the data context or make any database writes), you can retrieve the modified javascript object with:

```
EditableJSON.retrieve();
```

If you want immediate updates to a certain document in a certain collection to be persisted in mongo, just write:

```
{{> editableJSON collection="posts" document=post}}
```

where the helper `post` is returning a document from the `posts` collection. Or write `document=this` if the surrounding data context is already document from the `posts` collection.

More advanced use
---

If you want to explicity pass some JSON to the widget instead of using the surrounding data context:

```
{{> editableJSON json=myJSONFromAHelper}}
```

If you want several widgets operating on the screen at once:

```
{{> editableJSON json=customJSON1 store="custom1"}}
{{> editableJSON json=customJSON2 store="custom2"}}
```

And to retrieve these:

```
var customJSON1 = EditableJSON.retrieve("custom1");
var customJSON2 = EditableJSON.retrieve("custom2");
```

WARNING
===

This is **not** intended for production use. It's purpose is to help build client degugging tools for Meteor developers.