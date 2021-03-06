import Router from "routes"
import {Observable as O} from "rx"
import {createHashHistory} from "history"

const isObj = x => typeof x === "object" && x.constructor === Object

function makeRouterDriver(h = createHashHistory()) {
  return function RouterDriver({run, extract, compose}) {
    function route(in$, driverName, spec) {
      const r = new Router()
      Object.keys(spec).forEach(route => {
        r.addRoute(route, spec[route])
      })

      const path$ = extract(in$, driverName).map(l => l.pathname.replace(/^#/, ""))
      return path$.flatMapLatest(path => {
        const res = r.match(path)
        if (!res || !res.fn) {
          return O.throw(new Error("No route found for path: " + path))
        }
        const main = res.fn
        const params$ = compose({[`${driverName}.params`]: O.just(res.params)})
        return run(in$.merge(params$), main)
      })
    }

    const Transducers = {
      route
    }

    const location$ = O.create(o => {
      const dispose = h.listen(loc => o.onNext(loc))
      return {dispose}
    }).shareReplay(1)

    function executor(location$) {
      return location$.subscribe(newPath => {
        h.push(isObj(newPath) ? newPath : {
          pathname: newPath
        })
      })
    }

    return [Transducers, location$, executor]
  }

}

export default makeRouterDriver
