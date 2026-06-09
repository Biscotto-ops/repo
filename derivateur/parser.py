# -*- coding: utf-8 -*-
# ===========================================================================
#  parser.py  --  Etape 2 : tokens -> arbre d'expression (AST)
# ---------------------------------------------------------------------------
#  Analyseur "descente recursive" classique. Il respecte les priorites :
#
#       expr    := terme (('+' | '-') terme)*          <- + et - (gauche)
#       terme   := unaire (('*' | '/') unaire)*        <- * et / (gauche)
#       unaire  := '-' unaire | puissance              <- moins unaire
#       puiss.  := primaire ('^' unaire)?              <- ^ (droite)
#       primaire:= NUM | VAR | CONST
#                | FUNC '(' expr ')'
#                | '(' expr ')'
#
#  La puissance est associative a DROITE (x^y^z = x^(y^z)) et son exposant
#  passe par `unaire` pour accepter x^-1.
# ===========================================================================

from tokenizer import tokenize
import ast_noeuds as A


class _Parseur:
    """Petit objet qui garde la liste de tokens et un index courant."""

    def __init__(self, tokens):
        self.tokens = tokens
        self.i = 0

    # --- utilitaires de lecture -------------------------------------------
    def _regarde(self):
        """Token courant sans avancer, ou None si fini."""
        if self.i < len(self.tokens):
            return self.tokens[self.i]
        return None

    def _avance(self):
        tok = self.tokens[self.i]
        self.i += 1
        return tok

    def _attend(self, type_attendu):
        """Consomme un token du type voulu, sinon erreur."""
        tok = self._regarde()
        if tok is None or tok[0] != type_attendu:
            raise ValueError("Attendu %s mais trouve %r" % (type_attendu, tok))
        return self._avance()

    # --- regles de grammaire ----------------------------------------------
    def parse_expr(self):
        noeud = self.parse_terme()
        while True:
            tok = self._regarde()
            if tok is not None and tok[0] == 'OP' and tok[1] in ('+', '-'):
                self._avance()
                droite = self.parse_terme()
                noeud = (tok[1], noeud, droite)   # ('+', g, d) ou ('-', g, d)
            else:
                return noeud

    def parse_terme(self):
        noeud = self.parse_unaire()
        while True:
            tok = self._regarde()
            if tok is not None and tok[0] == 'OP' and tok[1] in ('*', '/'):
                self._avance()
                droite = self.parse_unaire()
                noeud = (tok[1], noeud, droite)   # ('*', g, d) ou ('/', g, d)
            else:
                return noeud

    def parse_unaire(self):
        tok = self._regarde()
        if tok is not None and tok[0] == 'OP' and tok[1] == '-':
            self._avance()
            return A.neg(self.parse_unaire())
        # un '+' unaire eventuel est simplement ignore
        if tok is not None and tok[0] == 'OP' and tok[1] == '+':
            self._avance()
            return self.parse_unaire()
        return self.parse_puissance()

    def parse_puissance(self):
        base = self.parse_primaire()
        tok = self._regarde()
        if tok is not None and tok[0] == 'OP' and tok[1] == '^':
            self._avance()
            exposant = self.parse_unaire()        # associatif a droite
            return A.pow_(base, exposant)
        return base

    def parse_primaire(self):
        tok = self._regarde()
        if tok is None:
            raise ValueError("Expression incomplete")

        type_, valeur = tok[0], tok[1]

        if type_ == 'NUM':
            self._avance()
            return A.num(valeur)

        if type_ == 'VAR':
            self._avance()
            return A.var()

        if type_ == 'CONST':
            self._avance()
            return A.const(valeur)

        if type_ == 'FUNC':
            self._avance()
            self._attend('LP')
            argument = self.parse_expr()
            self._attend('RP')
            return A.func(valeur, argument)

        if type_ == 'LP':
            self._avance()
            interieur = self.parse_expr()
            self._attend('RP')
            return interieur

        raise ValueError("Token inattendu : %r" % (tok,))


def parse(texte):
    """Point d'entree : chaine -> arbre. Verifie que tout est consomme."""
    p = _Parseur(tokenize(texte))
    arbre = p.parse_expr()
    if p._regarde() is not None:
        raise ValueError("Caracteres en trop apres : %r" % (p._regarde(),))
    return arbre
