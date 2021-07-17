/**
 * inspired by express.js
 * for running mysql queries sequentially by calling next() in the query callback
 * error handlers are only called if an error is caught or next(anything) is called
 */

const isErrorHandler = (fn) => typeof fn === "function" && fn.length === 4;

/**
 * @param {object} connection - mysql connection
 * @param {object} state - state object
 */
function makeSequencer(connection, state = {}) {
  // pass a list of functions to be called in sequence
  return (...fns) => {
    if (!fns.length) return;
    // tracks the current function in the chain
    let fn = fns.shift();
    const next = (err) => {
      // get the next function
      fn = fns.shift();
      if (err) {
        // skip to next error handler
        while (fn && !isErrorHandler(fn)) fn = fns.shift();
        if (fn) {
          fn(err, connection, state, next);
        } else throw err; // if no error handlers, throw error
      } else {
        // skip any error handlers if no error
        while (fn && isErrorHandler(fn)) fn = fns.shift();
        if (fn) {
          // run the next function
          try {
            fn(connection, state, next);
          } catch (err) {
            next(err);
          }
        }
      }
    };
    // run the first function
    try {
      fn(connection, state, next);
    } catch (err) {
      next(err);
    }
  };
}

export default makeSequencer;
