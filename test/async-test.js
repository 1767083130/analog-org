const assert = require('assert');
//const hello = require('../hello');

describe('#async hello', () => {
    describe('#async test', () => {
        // function(done) {}
        it('#async with done', (done) => {
            (async function () {
                try {
                    let r = await 1;
                    assert.strictEqual(r, 1);
                    done();
                } catch (err) {
                    done(err);
                }
            })();
        });

        it('#async function', async () => {
            let r = await 1;
            assert.strictEqual(r, 1);
        });

        it('#sync function', () => {
            assert(true);
        });
    });
});
