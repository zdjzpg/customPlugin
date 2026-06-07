const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

test('tool card styles include the scraped UU card rules and palette classes', () => {
  const styles = fs.readFileSync(
    path.join(__dirname, '..', 'public', 'styles.css'),
    'utf8'
  );

  assert.match(styles, /\.tool-group \.tool-item\{[\s\S]*padding:22px/);
  assert.match(styles, /\.tool-group \.tool-item__icon\{[\s\S]*width:48px/);
  assert.match(styles, /\.tool-group \.tool-item\.style1\{/);
  assert.match(styles, /\.tool-group \.tool-item\.style15\{/);
});

test('tool card styles keep the UU list spacing and desktop card width rules', () => {
  const styles = fs.readFileSync(
    path.join(__dirname, '..', 'public', 'styles.css'),
    'utf8'
  );

  assert.match(styles, /\.buyer-tool-list-shell\.tool-group/);
  assert.match(styles, /\.buyer-tool-list-shell \.grid-col-lg3/);
  assert.match(styles, /\.tool-group \.tool-item__title\{[\s\S]*font-size:22px/);
  assert.match(styles, /\.tool-group \.tool-item__desc\{[\s\S]*font-size:15px/);
});

test('buyer tool list overrides float columns with a CSS grid layout to avoid masonry gaps', () => {
  const styles = fs.readFileSync(
    path.join(__dirname, '..', 'public', 'styles.css'),
    'utf8'
  );

  assert.match(styles, /\.buyer-tool-list-shell\.tool-group\s*\{[\s\S]*display:\s*grid/);
  assert.match(styles, /\.buyer-tool-list-shell > \.grid-col-lg3\s*\{[\s\S]*float:\s*none/);
  assert.match(styles, /\.buyer-tool-list-shell\.grid-row::before,\s*\.buyer-tool-list-shell\.grid-row::after\s*\{[\s\S]*display:\s*none/);
});
