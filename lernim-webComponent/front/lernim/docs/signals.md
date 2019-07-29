# Signals

## studentChange

Modifies the user status inside the teacher instance.

`Student -> Teacher`

Data:

```js
let data = {
  userName: "<name of the student>",
  "<any property to inform and update>": "<value>"
}
```

## teacherChange

Modifies the teacher status inside the student instances.

`Teacher -> Student(All)`

Data:

```js
let data = {
  "<any property to inform and update>": "<value>"
}
```

## askIntervention

Asks the teacher to allow the intervention of an student or cancel it.

`Student -> Teacher`

Data:

```js
let data = {
  userName: "<name of the student>",
  required: "boolean" // default false
}
```

At any moment the teacher can gran the access with the `grantIntervention` signal.

## grantIntervention

Allows or revokes the intervention of a student. All users receive this signal to recognize the name of the streams to include them in the view.

`Teacher -> Student(All)`

Data:

```js
let data = {
  userName: "<name of the student>",
  granted: "boolean" // default false
}
```
