import { createProfile, loadCharacterCatalogs, previewStats, STAT_KEYS, STAT_LABELS } from '../services/playerProfile.js';
import { emptyBlock, errorBlock, escapeHtml, html, loadingBlock } from '../ui/components.js';
import { describeCharacter, renderCharacterPortrait } from './characterLook.js';

function optionList(items) {
  return items
    .map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>`)
    .join('');
}

function previewMarkup({ name, rpgClass, race }) {
  const stats = previewStats(rpgClass, race);
  return html`
    ${renderCharacterPortrait({ rpgClass, race })}
    <div class="ok-onboarding__summary">
      <p class="ok-copy">${escapeHtml(describeCharacter({ name, rpgClass, race }))}</p>
      <dl class="ok-stat-grid">
        ${STAT_KEYS.map(
          (key) => html`
            <div class="ok-stat">
              <dt>${STAT_LABELS[key]}</dt>
              <dd>${stats[key]}</dd>
            </div>
          `,
        ).join('')}
      </dl>
    </div>
  `;
}

export async function renderOnboardingView(container, { session, onCreated }) {
  container.innerHTML = loadingBlock('Carregando classes e raças...');
  const catalogs = await loadCharacterCatalogs();
  if (!catalogs.ok) {
    container.innerHTML = errorBlock(catalogs.error.message);
    return;
  }

  const { classes, races, elements } = catalogs.data;
  if (!classes.length || !races.length) {
    container.innerHTML = emptyBlock('Ainda não há classes ou raças publicadas. Volte em breve.');
    return;
  }

  container.innerHTML = html`
    <section class="ok-onboarding" aria-labelledby="onboarding-title">
      <header class="ok-onboarding__head">
        <p class="ok-kicker">Primeiro passo</p>
        <h1 id="onboarding-title" class="ok-route-title">Crie seu personagem</h1>
        <p class="ok-copy">Escolha nome, classe e raça. Os atributos ao lado mostram como você começa.</p>
      </header>
      <form id="character-form" class="ok-onboarding__form" novalidate>
        <div class="ok-field">
          <label class="ok-label" for="character-name">Nome do personagem</label>
          <input id="character-name" name="name" class="ok-input" maxlength="24" autocomplete="off" required />
          <p id="character-name-error" class="ok-helper is-error" role="alert" hidden></p>
        </div>
        <div class="ok-field">
          <label class="ok-label" for="character-class">Classe</label>
          <select id="character-class" name="class" class="ok-select">${optionList(classes)}</select>
          <p id="class-description" class="ok-helper"></p>
        </div>
        <div class="ok-field">
          <label class="ok-label" for="character-race">Raça</label>
          <select id="character-race" name="race" class="ok-select">${optionList(races)}</select>
          <p id="race-description" class="ok-helper"></p>
        </div>
        <div class="ok-field">
          <label class="ok-label" for="character-element">Elemento</label>
          <select id="character-element" name="element" class="ok-select">${optionList(elements)}</select>
          <p class="ok-helper">Seu elemento define a que você é forte ou fraco em combate.</p>
        </div>
        <p id="character-status" class="ok-helper" aria-live="polite"></p>
        <button id="character-submit" class="ok-button ok-button--primary" type="submit">Criar personagem</button>
      </form>
      <aside id="character-preview" class="ok-onboarding__preview" aria-label="Prévia do personagem"></aside>
    </section>
  `;

  const form = container.querySelector('#character-form');
  const nameInput = container.querySelector('#character-name');
  const nameError = container.querySelector('#character-name-error');
  const classSelect = container.querySelector('#character-class');
  const raceSelect = container.querySelector('#character-race');
  const elementSelect = container.querySelector('#character-element');
  if (elements.some((item) => item.id === 'neutral')) elementSelect.value = 'neutral';
  const status = container.querySelector('#character-status');
  const submit = container.querySelector('#character-submit');
  const preview = container.querySelector('#character-preview');

  const selected = () => ({
    name: nameInput.value,
    rpgClass: classes.find((item) => item.id === classSelect.value),
    race: races.find((item) => item.id === raceSelect.value),
  });

  const refresh = () => {
    const current = selected();
    preview.innerHTML = previewMarkup(current);
    container.querySelector('#class-description').textContent = current.rpgClass?.description || '';
    container.querySelector('#race-description').textContent = current.race?.description || '';
  };

  const validateName = () => {
    const message = nameInput.value.trim().length < 2 ? 'Informe um nome com pelo menos 2 caracteres.' : '';
    nameError.textContent = message;
    nameError.hidden = !message;
    nameInput.classList.toggle('is-error', Boolean(message));
    nameInput.setAttribute('aria-invalid', message ? 'true' : 'false');
    return !message;
  };

  nameInput.addEventListener('input', refresh);
  nameInput.addEventListener('blur', validateName);
  classSelect.addEventListener('change', refresh);
  raceSelect.addEventListener('change', refresh);
  refresh();

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (submit.disabled) return;
    if (!validateName()) {
      nameInput.focus();
      return;
    }

    submit.disabled = true;
    submit.classList.add('is-loading');
    status.className = 'ok-helper';
    status.textContent = 'Forjando seu personagem...';

    const current = selected();
    const result = await createProfile({
      characterName: current.name.trim(),
      rpgClass: current.rpgClass,
      race: current.race,
      elementId: elementSelect.value || 'neutral',
    });

    submit.classList.remove('is-loading');
    if (!result.ok) {
      submit.disabled = false;
      status.className = 'ok-helper is-error';
      status.textContent =
        result.error.code === 'conflict'
          ? 'Você já tem um personagem. Recarregue a página para continuar.'
          : result.error.message;
      return;
    }

    status.className = 'ok-helper is-success';
    status.textContent = 'Personagem criado. Abrindo seu painel...';
    onCreated(result.data);
  });

  nameInput.focus();
}
