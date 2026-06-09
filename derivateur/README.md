# Dérivateur symbolique pas-à-pas — TI-84 Plus CE Python

Dérive une fonction de `x` saisie en chaîne (ex. `3*x^2*sin(x)`, `ln(x)/x`)
et affiche les **étapes** avec le nom des règles en néerlandais
(`machtsregel`, `somregel`, `productregel`, `quotiëntregel`, `kettingregel`).

Pur Python, compatible MicroPython embarqué (pas de SymPy, numpy, ni regex).

## Avancement

- [x] `tokenizer.py` — chaîne → tokens
- [x] `ast_noeuds.py` — nœuds (tuples) + `to_str`
- [x] `parser.py` — tokens → arbre (AST)
- [x] `test_parser.py` — tests PC
- [ ] `deriv.py` — `differentiate` + journal d'étapes
- [ ] `simplify.py` — simplification basique
- [ ] `afficheur.py` — pagination + noms de règles
- [ ] `main.py` — entrée TI-84

## Tester sur PC

```
cd derivateur
python3 test_parser.py
```

## Transférer sur la TI-84 Plus CE (TI Connect CE)

1. Brancher la calculatrice en USB, ouvrir **TI Connect CE**.
2. Onglet **Calculator Explorer**.
3. Glisser-déposer le(s) fichier(s) `.py` dans la fenêtre (ou *Actions →
   Send to Calculators*). Le nom doit faire **≤ 8 caractères**, en
   majuscules, sans accent (ex. `DERIV.py`, `MAIN.py`).
4. Sur la calculatrice : touche **[prgm]** n'est PAS utilisée ; aller dans
   l'app **Python** → *Editor* → le fichier apparaît → **[Run]**.

> Astuce mémoire : pour le transfert final on pourra **fusionner** les
> modules en un seul fichier (les `import` entre fichiers `.py` fonctionnent
> sur la CE récente, mais un fichier unique économise de la place et évite
> les soucis de noms ≤ 8 caractères).
