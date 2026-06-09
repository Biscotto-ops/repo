# -*- coding: utf-8 -*-
# ===========================================================================
#  test_parser.py  --  A LANCER SUR PC (python3 test_parser.py)
# ---------------------------------------------------------------------------
#  Verifie le tokenizer et le parser avant de passer a la derivation.
#  Strategie : on parse une chaine, on la reconstruit avec to_str, et on
#  reparse le resultat -> l'arbre doit etre identique (stabilite).
# ===========================================================================

from tokenizer import tokenize
from parser import parse
from ast_noeuds import to_str

# (entree, arbre attendu)
CAS = [
    ("3", ('num', 3)),
    ("x", ('var',)),
    ("x^2", ('^', ('var',), ('num', 2))),
    ("-x^2", ('neg', ('^', ('var',), ('num', 2)))),          # = -(x^2)
    ("x^-1", ('^', ('var',), ('neg', ('num', 1)))),
    ("3*x^2*sin(x)",
        ('*', ('*', ('num', 3), ('^', ('var',), ('num', 2))),
              ('func', 'sin', ('var',)))),
    ("ln(x)/x", ('/', ('func', 'ln', ('var',)), ('var',))),
    ("a", None),            # doit lever une erreur (nom inconnu)
]


def arbres_egaux(a, b):
    return a == b


def main():
    total = 0
    ok = 0

    for entree, attendu in CAS:
        total += 1
        try:
            arbre = parse(entree)
        except ValueError as e:
            if attendu is None:
                print("OK   (erreur attendue) %-14r -> %s" % (entree, e))
                ok += 1
            else:
                print("FAIL %-14r a leve une erreur : %s" % (entree, e))
            continue

        if attendu is None:
            print("FAIL %-14r aurait du lever une erreur" % (entree,))
            continue

        if arbres_egaux(arbre, attendu):
            # test de stabilite : reconstruire puis reparser
            reconstruit = to_str(arbre)
            try:
                arbre2 = parse(reconstruit)
            except ValueError as e:
                print("FAIL %-14r to_str='%s' ne reparse pas : %s"
                      % (entree, reconstruit, e))
                continue
            if arbres_egaux(arbre, arbre2):
                print("OK   %-14r -> %s" % (entree, reconstruit))
                ok += 1
            else:
                print("FAIL %-14r instable : '%s' -> %r" %
                      (entree, reconstruit, arbre2))
        else:
            print("FAIL %-14r\n        obtenu  : %r\n        attendu : %r"
                  % (entree, arbre, attendu))

    print("\n%d/%d tests reussis" % (ok, total))


if __name__ == '__main__':
    main()
