Editable JSON for Meteor - [Demo](http://meteorpad.com/pad/AphADo6eR4aiJmNzS/Editable%20JSON%20Example)
===

Quick Start
---

```
meteor add babrahams:editable-json
```

In a template, write:

```
{{> editableJSON collection="posts" document=post}}
```

where a helper is returning a post. Or write `document=this` if in the context of the post.

Alternatively, if you don't want immediate updates to a certain document in a certain collection:

```
{{> editableJSON}}
```

This will turn the current data context into JSON.

After editing (it won't affect the data context), you can retrieve the modified JSON with:

```
EditableJSON.retrieve();
```

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