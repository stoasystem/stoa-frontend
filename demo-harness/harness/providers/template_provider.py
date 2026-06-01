from __future__ import annotations

from .base import ProviderRequest, ProviderResponse


class TemplateProvider:
    provider_name = "template"

    def generate(self, request: ProviderRequest) -> ProviderResponse:
        subject = request.subject or "this question"
        question = (request.question or "").lower()
        language = normalize_language(request.language)
        normalized_subject = subject.strip().lower()
        out_of_scope = (
            normalized_subject not in {"", "general", "this question"}
            and normalized_subject not in {item.strip().lower() for item in request.registered_subjects}
            and bool(request.registered_subjects)
        )

        if out_of_scope:
            text = localized_text(language, "out_of_scope")
        elif any(token in question for token in ("copy", "just give me", "final homework answer", "do my homework", "answer only")):
            text = localized_text(language, "cheating")
        elif "teacher" in question or "still" in question or "confused" in question or "do not understand" in question:
            text = localized_text(language, "confused")
        elif "3x + 5" in question or "3x+5" in question:
            text = localized_text(language, "linear_equation")
        elif "x^2" in question or "quadratic" in question:
            text = localized_text(language, "quadratic")
        elif "solve" in question:
            text = localized_text(language, "solve")
        elif "speed" in question or "distance" in question or "time" in question:
            text = localized_text(language, "speed")
        else:
            text = localized_text(language, "generic")

        return ProviderResponse(text=text, provider_name=self.provider_name, fallback_used=True)


def normalize_language(value: str | None) -> str:
    language = (value or "en").strip().lower()
    return language if language in {"en", "de", "fr", "it"} else "en"


def localized_text(language: str, key: str) -> str:
    return TEXTS.get(language, TEXTS["en"]).get(key, TEXTS["en"][key])


TEXTS = {
    "en": {
        "out_of_scope": (
            "Let's first check the learning scope. This looks outside the subjects saved in your learning profile. "
            "I can help you connect the question to your current subjects, or you can ask for professional teacher support."
        ),
        "cheating": (
            "I can't help you copy a final homework answer, but we can work through the first step together. "
            "Start by naming what the problem is asking, then choose the operation or rule that moves you one step closer."
        ),
        "confused": (
            "Let's slow down and look at the part that feels unclear. Point to the first step where you get stuck, "
            "then compare it with the rule or example you used before. If it still does not make sense, ask for professional teacher support."
        ),
        "linear_equation": (
            "Let's solve the equation step by step. First, subtract 5 from both sides to keep the equation balanced. "
            "Next, divide both sides by 3, then check the result in the original equation."
        ),
        "quadratic": (
            "Let's factor the quadratic step by step. First, look for two numbers that multiply to 6 and add to 5. "
            "Next, use the zero-product idea and check each value in the original equation."
        ),
        "solve": (
            "Let's work through the structure first. Start by identifying what operation is being done to the unknown, "
            "then undo those operations in reverse order and check the result."
        ),
        "speed": (
            "Let's sort the information first. Write down the distance, the time, and what the question asks for. "
            "Then choose the relationship that connects those ideas and check the units."
        ),
        "generic": (
            "Let's work through this step by step. First, identify what the question is asking. "
            "Next, list the information you already have and choose a method that fits your current level."
        ),
    },
    "de": {
        "out_of_scope": (
            "Lass uns zuerst den Lernbereich Schritt fuer Schritt pruefen. Diese Frage liegt ausserhalb der Faecher in deinem Lernprofil. "
            "Wir koennen sie mit deinen aktuellen Faechern verbinden, oder du fragst eine Lehrperson um Unterstuetzung."
        ),
        "cheating": (
            "Ich helfe dir nicht beim Abschreiben einer fertigen Hausaufgabe, aber wir gehen den ersten Schritt gemeinsam durch. "
            "Starte damit, die Frage zu benennen und die passende Regel zu waehlen."
        ),
        "confused": (
            "Lass uns den unklaren Schritt langsam anschauen. Zeige zuerst, wo du feststeckst, und vergleiche ihn mit der passenden Regel. "
            "Wenn es weiter unklar bleibt, frage eine Lehrperson um Unterstuetzung."
        ),
        "linear_equation": (
            "Loesen wir die Gleichung Schritt fuer Schritt. Ziehe zuerst 5 auf beiden Seiten ab, damit die Gleichung im Gleichgewicht bleibt. "
            "Teile danach beide Seiten durch 3 und pruefe das Ergebnis in der Ausgangsgleichung."
        ),
        "quadratic": (
            "Faktorisieren wir die quadratische Gleichung Schritt fuer Schritt. Suche zuerst zwei Zahlen, die 6 ergeben und zusammen 5 sind. "
            "Nutze danach die Nullproduktregel und pruefe beide Werte."
        ),
        "solve": (
            "Schauen wir zuerst auf die Struktur. Starte mit der Operation am Unbekannten, mache die Schritte rueckwaerts, "
            "und pruefe danach das Ergebnis."
        ),
        "speed": (
            "Ordnen wir die Angaben zuerst Schritt fuer Schritt. Schreibe Strecke, Zeit und die gesuchte Groesse auf. "
            "Waehle dann die passende Beziehung und pruefe die Einheiten."
        ),
        "generic": (
            "Lass uns Schritt fuer Schritt arbeiten. Beginne mit der Frage: Was ist gegeben und was soll gefunden werden? "
            "Waehle dann eine Methode, die zu deinem aktuellen Stand passt."
        ),
    },
    "fr": {
        "out_of_scope": (
            "Verifions d'abord le cadre d'apprentissage etape par etape. Cette question semble hors des matieres de ton profil. "
            "Nous pouvons la relier a tes matieres actuelles, ou tu peux demander l'aide d'un enseignant."
        ),
        "cheating": (
            "Je ne peux pas t'aider a copier une reponse finale, mais nous pouvons travailler la premiere etape ensemble. "
            "Commence par dire ce que la question demande, puis choisis la regle utile."
        ),
        "confused": (
            "Regardons lentement l'etape qui bloque. Montre d'abord ou tu es coince, puis compare avec la regle ou l'exemple. "
            "Si cela reste confus, demande l'aide d'un enseignant."
        ),
        "linear_equation": (
            "Resolvons l'equation etape par etape. Soustrais d'abord 5 des deux cotes pour garder l'equilibre. "
            "Ensuite, divise les deux cotes par 3, puis verifie dans l'equation de depart."
        ),
        "quadratic": (
            "Factorisons le trinome etape par etape. Cherche d'abord deux nombres dont le produit vaut 6 et la somme vaut 5. "
            "Ensuite, utilise l'idee du produit nul et verifie chaque valeur."
        ),
        "solve": (
            "Observons d'abord la structure. Commence par l'operation appliquee a l'inconnue, fais les etapes en sens inverse, "
            "puis verifie le resultat."
        ),
        "speed": (
            "Classons d'abord les informations etape par etape. Note la distance, le temps et ce que la question demande. "
            "Choisis ensuite la relation qui relie ces idees et verifie les unites."
        ),
        "generic": (
            "Avancons etape par etape. Commence par reperer ce qui est donne et ce que la question demande. "
            "Ensuite, choisis une methode adaptee a ton niveau actuel."
        ),
    },
    "it": {
        "out_of_scope": (
            "Controlliamo prima il percorso di apprendimento passo dopo passo. Questa domanda sembra fuori dalle materie del tuo profilo. "
            "Possiamo collegarla alle tue materie attuali, oppure puoi chiedere supporto a un insegnante."
        ),
        "cheating": (
            "Non posso aiutarti a copiare una risposta finale, ma possiamo fare insieme il primo passo. "
            "Inizia dicendo che cosa chiede il problema, poi scegli la regola utile."
        ),
        "confused": (
            "Guardiamo con calma il passaggio poco chiaro. Indica prima dove ti blocchi, poi confrontalo con la regola o l'esempio. "
            "Se resta confuso, chiedi supporto a un insegnante."
        ),
        "linear_equation": (
            "Risolviamo l'equazione passo dopo passo. Prima sottrai 5 da entrambi i lati per mantenere l'equilibrio. "
            "Poi dividi entrambi i lati per 3 e controlla il risultato nell'equazione iniziale."
        ),
        "quadratic": (
            "Scomponiamo la quadratica passo dopo passo. Cerca prima due numeri che moltiplicati danno 6 e sommati danno 5. "
            "Poi usa l'idea del prodotto nullo e controlla ogni valore."
        ),
        "solve": (
            "Guardiamo prima la struttura. Inizia dall'operazione applicata all'incognita, fai i passaggi al contrario, "
            "poi controlla il risultato."
        ),
        "speed": (
            "Mettiamo in ordine le informazioni passo dopo passo. Scrivi distanza, tempo e che cosa chiede la domanda. "
            "Poi scegli la relazione giusta e controlla le unita."
        ),
        "generic": (
            "Procediamo passo dopo passo. Prima individua i dati e che cosa chiede la domanda. "
            "Poi scegli un metodo adatto al tuo livello attuale."
        ),
    },
}
