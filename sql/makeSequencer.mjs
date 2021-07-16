/**
 * inspired by express.js
 * for running mysql queries sequentially by calling next() in the query callback
 */
function withConnection(connection, state = {}) {
  return (...fns) => {
    if (!fns.length) return;
    let fn = fns.shift();
    const next = (err) => {
      fn = fns.shift();
      if (err) {
        while (fn && fn.length !== 4) fn = fns.shift();
        if (fn) {
          fn(err, connection, state, next);
        } else throw err;
      } else if (fn) {
        fn(connection, state, next);
      }
    };
    fn(connection, state, next);
  };
}

export default withConnection;
