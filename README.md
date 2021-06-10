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

    const loadScript = (url) => {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script')
            const headElement = document.getElementsByTagName('head')[0]

            script.onload = resolve
            script.onerror = reject
            script.src = url

            headElement.appendChild(script)
        })
    }

    loadScript('http://localhost:8080/client/')
        .then(() => {
            const casino = new ConsoleCasino()
            casino.roulette.start()
        })

**Supported Casinos**

- Any casino using Playtech gaming software
- Tested on [Betfair](https://www.betfair.com/) Live Casino