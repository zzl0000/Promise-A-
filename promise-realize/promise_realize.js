/*
 *                   江城子 . 程序员之歌
 * 
 *               十年生死两茫茫，写程序，到天亮。
 *                   千行代码，Bug何处藏。
 *               纵使上线又怎样，朝令改，夕断肠。
 * 
 *               领导每天新想法，天天改，日日忙。
 *                   相顾无言，惟有泪千行。
 *               每晚灯火阑珊处，夜难寐，加班狂。
 * 
 */

/*
 * @Author: your name
 * @Date: 2020-11-25 15:41:29
 * @LastEditTime: 2020-11-25 15:44:54
 * @LastEditors: Please set LastEditors
 * @Description: In User Settings Edit
 * @FilePath:\mine\Promise-A-\promise-realize\promise_realize.js
 */


/**
 * @description: promise
 * @param {*}
 * @return {*}
 */

const STATUS = {
  PENDING: 'pending',
  FULFILLED: 'fulfilled',
  REJECTED: 'rejected'
}

class _Promise {

  constructor(executor) {
    this._status = STATUS.PENDING  //promise 初始状态
    this._value = undefined // then 默认返回值
    this._resolveQueue = [] // reslove时触发的成功队列
    this._rejectQueue = []  //reject时触发的成功队列

    if (typeof executor !== 'function') {
      throw new Error(`promise resolver ${executor} is not a function`)
    }

    const resolve = value => {
      //成功后的一系列操作(状态改变，成功后的回调)
      const run = () => {
        // Promise/A+ 规范规定的Promise状态只能从pending触发，变成fulfilled
        if (this._status === STATUS.PENDING) {
          this._status = STATUS.FULFILLED
          this._value = value // 储存当前值 用于回调
          // 执行resolve 回调
          while (this._resolveQueue.length) {
            const callback = this._rejectQueue.shift()
            callback(value)
          }
        }
      }
      //把resolve执行回调的操作封装成一个函数,放进setTimeout里,以实现promise异步调用的特性（规范上是微任务，这里是宏任务）
      setTimeout(run);
    }
    const reject = value => {
      //失败后的一系列操作(状态改变，失败后的回调)
      const run = () => {
        if (this._status === STATUS.PENDING) {
          this._status = STATUS.REJECTED
          this._value = value // 储存当前值 用于回调
          // 执行resolve 回调
          while (this._rejectQueue.length) {
            const callback = this._rejectQueue.shift()
            callback(value)
          }
        }
      }
      setTimeout(run);
    }

    try {
      executor(resolve, reject)
    } catch (err) {
      reject(err)
    }

  }

  /**
   * @description: promise then方法接收一个成功的回调一个失败的回调
   * @param {*}
   * @return {*}
   */

  then (onFulfilled, onRejected) {
    // 根据Promise/A+ 规范规定如果onFulfilled不是一个function 则忽略它, 让值继续往下传递，链式调用继续往下执行
    if (typeof onFulfilled !== 'function') {
      onFulfilled = value => value
    }
    // 根据Promise/A+ onRejected 则忽略它, 让值继续往下传递，链式调用继续往下执行
    if (typeof onRejected !== 'function') {
      onRejected = error => error
    }

    const _promise = new _Promise((resolve, reject) => {
      const resolveFn = value => {
        try {
          const x = onFulfilled(value)
          // 分类讨论返回值,如果是Promise,那么等待Promise状态变更,否则直接resolve
          x instanceof _Promise ? x.then(resolve, reject) : resolve(x)
        } catch (error) {
          reject(error)
        }
      }
      const rejectFn = error => {
        try {
          const x = onRejected(error)
          // 分类讨论返回值,如果是Promise,那么等待Promise状态变更,否则直接resolve
          x instanceof _Promise ? x.then(resolve, reject) : resolve(x)
        } catch (error) {
          reject(error)
        }
      }
      switch (this._status) {
        case STATUS.PENDING:
          this._resolveQueue.push(resolveFn)
          this._rejectQueue.push(rejectFn)
          break;
        case STATUS.FULFILLED:
          resolveFn(this._value)
          break;
        case STATUS.REJECTED:
          rejectFn(this._value)
          break;
      }
    })

    return _promise

  }

  /**
   * @description: promise cath方法接收一个失败的回调
   * @param {*}
   * @return {*}
   */

  catch (rejectFn) {
    return this.then(undefined, rejectFn)
  }

  /**
   * @description: promise finally
   * @param {*}
   * @return {*}
   */

  finally (callback) {
    return this.then(value => _Promise.resolve(callback()).then(() => value), error => {
      _Promise.resolve(callback()).then(() => error)
    })
  }

  // 静态resolve方法
  static resolve (value) {
    return value instanceof _Promise ? value : new _Promise(resolve => resolve(value))
  }

  // 静态reject方法
  static reject (error) {
    return new _Promise((resolve, reject) => reject(error))
  }

  // 静态all方法
  static all (promiseArr) {
    let count = 0
    let result = []
    return new _Promise((resolve, reject) => {
      if (!promiseArr.length) {
        return resolve(result)
      }
      promiseArr.forEach((p, i) => {
        _Promise.resolve(p).then(value => {
          count++
          result[i] = value
          if (count === promiseArr.length) {
            resolve(result)
          }
        }, error => {
          reject(error)
        })
      })
    })
  }

  // 静态race方法
  static race (promiseArr) {
    return new _Promise((resolve, reject) => {
      promiseArr.forEach(p => {
        _Promise.resolve(p).then(value => {
          resolve(value)
        }, error => {
          reject(error)
        })
      })
    })
  }
}
