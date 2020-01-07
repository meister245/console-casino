console-casino
--------------

Casino gambling bot for automating online casino games using state machines in the browser console

#### Disclaimer

> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  SOFTWARE.

#### Requirements

- Modern web browser supporting ES7+
- Tested using Google Chrome (79.0.x)

#### Usage

1. Navigate browser to casino game window
2. Open Chrome Developer Tools or equivalent
3. Load script into document

        var script = document.createElement('script');
        script.type = 'text/javascript';

        fetch('https://raw.githubusercontent.com/meister245/console-casino/master/dist/console-casino.min.js')
            .then(response => response.text())
            .then(text => script.textContent = text)

        document.body.appendChild(script);

4. Instantiate bot instance, specify driver name

        var driverName = 'playtech'; // casino game vendor driver name

        const r = new RouletteBot(driverName);

5. Start betting task

        var bagSize = 30.0; // reserve amount for task from total balance
        var strategyName = 'progressive-red-black'; // strategy name
        var options = {dryRun: false, chipSize: 0.20}; // simulation only, bet unit size

        r.start(strategyName, bagSize, options);