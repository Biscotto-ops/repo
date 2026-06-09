# -*- coding: utf-8 -*-
# ===========================================================================
#  ast_noeuds.py  --  Outils communs sur l'arbre d'expression (AST)
# ---------------------------------------------------------------------------
#  Un noeud est un simple tuple (choix volontaire : leger en memoire sur la
#  TI-84). Formes possibles :
#       ('num', valeur)        constante numerique
#       ('var',)               la variable x
#       ('const', nom)         constante symbolique : 'e', 'pi'
#       ('+', g, d)            somme
#       ('-', g, d)            difference
#       ('*', g, d)            produit
#       ('/', g, d)            quotient
#       ('^', base, exp)       puissance
#       ('neg', a)             moins unaire
#       ('func', nom, arg)     fonction (sin, cos, tan, ln, log, exp, sqrt)
#
#  Ce fichier regroupe :
#    - des petits constructeurs (num, var, ...) pour rendre le code lisible
#    - to_str(noeud) qui reconstruit une chaine humaine a partir de l'arbre
# ===========================================================================

# --- constructeurs pratiques ----------------------------------------------

def num(v):
    return ('num', v)

def var():
    return ('var',)

def const(nom):
    return ('const', nom)

def add(g, d):
    return ('+', g, d)

def sub(g, d):
    return ('-', g, d)

def mul(g, d):
    return ('*', g, d)

def div(g, d):
    return ('/', g, d)

def pow_(b, e):
    return ('^', b, e)

def neg(a):
    return ('neg', a)

def func(nom, arg):
    return ('func', nom, arg)


# --- priorite des operateurs (pour savoir quand mettre des parentheses) ----
#  Plus le nombre est grand, plus l'operateur "colle".
_PRIORITE = {'+': 1, '-': 1, '*': 2, '/': 2, 'neg': 3, '^': 4}


def _prio(noeud):
    t = noeud[0]
    if t in _PRIORITE:
        return _PRIORITE[t]
    # num, var, const, func : ce sont des atomes -> priorite maximale
    return 5


def to_str(noeud):
    """Reconstruit une chaine lisible a partir d'un arbre.
    Met des parentheses uniquement quand c'est necessaire.
    """
    t = noeud[0]

    if t == 'num':
        return _num_str(noeud[1])
    if t == 'var':
        return 'x'
    if t == 'const':
        return noeud[1]
    if t == 'func':
        return noeud[1] + '(' + to_str(noeud[2]) + ')'

    if t == 'neg':
        a = noeud[1]
        sa = to_str(a)
        if _prio(a) < _PRIORITE['neg']:
            sa = '(' + sa + ')'
        return '-' + sa

    if t == '^':
        b, e = noeud[1], noeud[2]
        sb = to_str(b)
        se = to_str(e)
        # la base doit etre parenthesee si sa priorite est <= celle de ^
        if _prio(b) <= _PRIORITE['^']:
            sb = '(' + sb + ')'
        # l'exposant est parenthese s'il est compose (somme, produit, neg...)
        if _prio(e) < 5:
            se = '(' + se + ')'
        return sb + '^' + se

    # operateurs binaires + - * /
    g, d = noeud[1], noeud[2]
    sg = to_str(g)
    sd = to_str(d)
    mien = _PRIORITE[t]

    # parenthese a gauche si l'enfant colle moins fort
    if _prio(g) < mien:
        sg = '(' + sg + ')'
    # a droite : pour - et / il faut aussi parentheser a priorite egale
    #   ex : a-(b+c) , a/(b*c)
    if _prio(d) < mien or (_prio(d) == mien and t in ('-', '/')):
        sd = '(' + sd + ')'

    return sg + ' ' + t + ' ' + sd


def _num_str(v):
    """Affiche un nombre proprement : 3 plutot que 3.0 si entier."""
    if isinstance(v, float) and v == int(v):
        return str(int(v))
    return str(v)
