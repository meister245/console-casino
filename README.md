console-casino
--------------

Casino gambling bot for backtesting and automating online casino games
using state machines in the browser developer console

#### Disclaimer

> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  SOFTWARE.

#### Description & Usage

**Requirements**

- Modern web browser supporting ES7+
- Personal account on online casino website that provides
- Tested using Google Chrome Developer Tools Console (79.0.x)

**Loading Script**

    var script = document.createElement('script');
    script.type = 'text/javascript';

    fetch('https://raw.githubusercontent.com/meister245/console-casino/master/dist/console-casino.min.js')
        .then(response => response.text())
        .then(text => script.textContent = text)

    document.body.appendChild(script);

**Drivers & Strategies**

The casino bots use a driver for each different game provider in order to interact with the
game window.

    // list of drivers
    ConsoleCasino.getDrivers();

Each casino game type has a list of available supported strategies.

    // list of strategies
    ConsoleCasino.getStrategies();

**Parameters**

- `driverName` - string, driver name
- `strategyName` - string, strategy name
- `bagSize` - number, reserve money amount from total balance for strategy
- `dryRun` - boolean, simulation or live run
- `chipSize` - number, base bet amount for strategies

**Demo**

    // instantiate script
    var driverName = 'playtech'; 
    const casino = new ConsoleCasino(driverName);

    // strategy parameters
    var strategyName = 'progressive-red-black';
    var bagSize = 5.0;
    var options = {dryRun: false, chipSize: 0.2}

    // run roulette strategy
    casino.roulette.start(strategyName, bagSize, options);

    // run backtest for roulette strategy
    casino.roulette.backtest(strategyName, bagSize, options);

    // get submitted tasks
    casino.roulette.tasks;

**Supported Casinos**

- Any casino using Playtech gaming software
- Tested on [Betfair](https://www.betfair.com/) Live Casino