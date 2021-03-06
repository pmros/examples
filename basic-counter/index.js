import {Observable as O} from "rx"

const main = (T, initial = 0) => in$ => {
  const {DOM: {h, prepare, events}, compose, decompose} = T

  const [actions] = decompose(in$, "inc$", "dec$")
  return intent(view(model(actions)))

  function model({inc$, dec$}) {
    return inc$
      .map(() => +1)
      .merge(dec$.map(() => -1))
      .startWith(initial)
      .scan((state, d) => state + d)
      .shareReplay(1)
  }

  function view(counter$) {
    const vdom$ = counter$.map(value => h("div", [
      h("h1", `Counter is ${value}`),
      h("p", [
        h("button.inc", "Increment"),
        h("button.dec", "Decrement"),
        h("button.inc-async", "Increment after 1 sec"),
        h("button.dec-odd", "Decrement if odd")
      ])
    ]))
    return [counter$, prepare(vdom$)]
  }

  function intent([counter$, vdom$]) {
    const inc$ = O.merge(
      events(vdom$, ".inc", "click"),
      events(vdom$, ".inc-async", "click").delay(1000)
    )
    const dec$ = O.merge(
      events(vdom$, ".dec", "click"),
      counter$.sample(events(vdom$, ".dec-odd", "click")).filter(val => val % 2)
    )

    const out$ = compose({DOM: vdom$, value$: counter$})
    const action$ = compose({inc$, dec$})
    return [out$, action$]
  }
}

export default main
