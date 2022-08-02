# A Bitails API JS Wrapper library for Bitcoin SV Developer


https://bitails.net/

## Documentation

https://docs.bitails.net/

## Install

---

```javascript
npm install bitails --save
```

## Sample Usage

Check out these [test code](https://github.com/samooth/bitails/tree/master/test) in JavaScript and TypeScript to get up and running quickly.

## History

### 0.2.0
- Support Cache, default is true. if you don't want cache, set option `{ enableCache: false }`
- Support ApiKey and rate limit to 3 requests/sec without apiKey.
```
  // with apiKey, no threshold
  const woc = new Bitails( 'testnet', { apiKey: 'your api key'}  )
```
```
  // without apiKey, threshold is 3 requests/1000ms
  const woc = new Bitails( 'testnet' )
```
- Support JSDoc type check.

### 0.1.0
- Initate, Support all API in document.

# License

It is released under the terms of the Open BSV license.
