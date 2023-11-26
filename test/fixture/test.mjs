export const test = async function (msg, run, arg = null) {
  let ok = 'Success ::'
  try {
    arg = await run(arg)
    console.log('\x1b[32m%s\x1b[0m', '✔', ` ${msg} :: ${ok}\r\n`)
    return arg
  } catch (e) {
    ok = 'Failed ::'
    console.error(e)
    console.log('\x1b[31m%s\x1b[0m', '✖', ` ${msg} :: ${ok}\r\n`)
  }
}
