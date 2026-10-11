// Efeito visual de rolagem de dados. Só anima o que o motor realmente rolou
// (notação + resultado vêm do evento do combate ou do teste).

const MAX_DICE = 4;

function parseNotation(notation) {
  const match = /^\s*(\d{1,2})d(\d{1,3})\s*$/i.exec(String(notation || ''));
  if (!match) return { count: 1, sides: 20 };
  return { count: Math.min(MAX_DICE, Math.max(1, Number(match[1]))), sides: Math.max(2, Number(match[2])) };
}

// Divide o total em `count` valores plausíveis (1..sides) que somam o resultado.
function splitTotal(total, count, sides) {
  if (count === 1) return [total];
  const values = Array(count).fill(1);
  let rest = Math.max(0, total - count);
  for (let index = 0; rest > 0; index = (index + 1) % count) {
    if (values[index] < sides) {
      const add = Math.min(rest, 1 + Math.floor(Math.random() * Math.max(1, sides - values[index])));
      values[index] += add;
      rest -= add;
    }
    if (values.every((value) => value >= sides)) break;
  }
  return values;
}

function reducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// Rola `notation` (ex.: '1d6', '1d20') terminando em `result`. Resolve quando o efeito acaba.
export async function rollDiceEffect({ notation = '1d20', result, label = '' }) {
  const { count, sides } = parseNotation(notation);
  const finals = splitTotal(Math.max(count, Number(result) || 1), count, sides);
  const overlay = document.createElement('div');
  overlay.className = 'ok-dice-overlay';
  overlay.setAttribute('role', 'status');
  overlay.setAttribute('aria-live', 'polite');
  overlay.innerHTML = `
    <div class="ok-dice-stage">
      ${label ? `<p class="ok-dice-label"></p>` : ''}
      <div class="ok-dice-row">
        ${finals.map(() => `<span class="ok-die ok-die--d${sides} is-rolling"><span class="ok-die__face">?</span></span>`).join('')}
      </div>
      <p class="ok-dice-total"></p>
    </div>`;
  if (label) overlay.querySelector('.ok-dice-label').textContent = label;
  document.body.appendChild(overlay);

  const dice = [...overlay.querySelectorAll('.ok-die')];
  const faces = dice.map((die) => die.querySelector('.ok-die__face'));
  const total = overlay.querySelector('.ok-dice-total');
  const still = reducedMotion();

  if (!still) {
    const started = performance.now();
    await new Promise((resolve) => {
      const timer = setInterval(() => {
        faces.forEach((face) => {
          face.textContent = String(1 + Math.floor(Math.random() * sides));
        });
        if (performance.now() - started > 950) {
          clearInterval(timer);
          resolve();
        }
      }, 70);
    });
  }

  dice.forEach((die, index) => {
    die.classList.remove('is-rolling');
    die.classList.add('is-settled');
    faces[index].textContent = String(finals[index]);
  });
  total.textContent = count > 1 ? `Total ${finals.reduce((sum, value) => sum + value, 0)}` : '';
  await wait(still ? 700 : 850);
  overlay.classList.add('is-leaving');
  await wait(still ? 0 : 220);
  overlay.remove();
}
