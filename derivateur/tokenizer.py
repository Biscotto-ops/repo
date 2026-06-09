# -*- coding: utf-8 -*-
# ===========================================================================
#  tokenizer.py  --  Etape 1 : decoupage de la chaine en "tokens"
# ---------------------------------------------------------------------------
#  Transforme une chaine comme "3*x^2*sin(x)" en une liste de jetons :
#     [('NUM', 3), ('OP', '*'), ('VAR', 'x'), ('OP', '^'), ('NUM', 2),
#      ('OP', '*'), ('FUNC', 'sin'), ('LP', '('), ('VAR', 'x'), ('RP', ')')]
#
#  Ecrit en pur Python (compatible MicroPython TI-84 : pas de regex, pas
#  de bibliotheque externe).
# ===========================================================================

# Noms de fonctions reconnues. On derivera chacune plus tard.
FONCTIONS = ('sin', 'cos', 'tan', 'ln', 'log', 'exp', 'sqrt')

# Constantes symboliques reconnues.
CONSTANTES = ('e', 'pi')

# Operateurs a un seul caractere.
OPERATEURS = '+-*/^'


def _est_chiffre(c):
    return '0' <= c <= '9'


def _est_lettre(c):
    return ('a' <= c <= 'z') or ('A' <= c <= 'Z')


def tokenize(texte):
    """Renvoie la liste des tokens correspondant a `texte`.

    Chaque token est un tuple (TYPE, valeur) ou TYPE vaut :
       'NUM'   -> nombre (int ou float)
       'VAR'   -> la variable x
       'CONST' -> constante symbolique ('e' ou 'pi')
       'FUNC'  -> nom de fonction ('sin', 'cos', ...)
       'OP'    -> operateur (+ - * / ^)
       'LP'    -> parenthese ouvrante
       'RP'    -> parenthese fermante
       'COMMA' -> virgule (reserve, non utilise pour l'instant)
    Leve ValueError si un caractere est invalide.
    """
    tokens = []
    i = 0
    n = len(texte)

    while i < n:
        c = texte[i]

        # --- on ignore les espaces -----------------------------------------
        if c == ' ' or c == '\t':
            i += 1
            continue

        # --- nombres : suite de chiffres, eventuellement avec un point -----
        if _est_chiffre(c) or (c == '.' and i + 1 < n and _est_chiffre(texte[i + 1])):
            debut = i
            a_un_point = False
            while i < n and (_est_chiffre(texte[i]) or texte[i] == '.'):
                if texte[i] == '.':
                    if a_un_point:           # deux points -> erreur
                        raise ValueError("Nombre invalide pres de la position %d" % debut)
                    a_un_point = True
                i += 1
            morceau = texte[debut:i]
            valeur = float(morceau) if a_un_point else int(morceau)
            tokens.append(('NUM', valeur))
            continue

        # --- identifiants : lettres (variable, constante ou fonction) ------
        if _est_lettre(c):
            debut = i
            while i < n and (_est_lettre(texte[i]) or _est_chiffre(texte[i])):
                i += 1
            nom = texte[debut:i]
            if nom == 'x':
                tokens.append(('VAR', 'x'))
            elif nom in CONSTANTES:
                tokens.append(('CONST', nom))
            elif nom in FONCTIONS:
                tokens.append(('FUNC', nom))
            else:
                raise ValueError("Nom inconnu : '%s'" % nom)
            continue

        # --- operateurs -----------------------------------------------------
        if c in OPERATEURS:
            tokens.append(('OP', c))
            i += 1
            continue

        # --- parentheses et virgule ----------------------------------------
        if c == '(':
            tokens.append(('LP', '('))
            i += 1
            continue
        if c == ')':
            tokens.append(('RP', ')'))
            i += 1
            continue
        if c == ',':
            tokens.append(('COMMA', ','))
            i += 1
            continue

        # --- tout le reste est une erreur ----------------------------------
        raise ValueError("Caractere invalide : '%s' (position %d)" % (c, i))

    return tokens
