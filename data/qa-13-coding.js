/* Coding and Practical Implementation — 22 questions */
window.QA_SECTION = {
  id: '13',
  slug: 'coding',
  title: 'Coding & Practical Implementation',
  blurb: 'The implementations interviewers actually ask you to write — with the details that separate working code from a sketch.',
  questions: [
{ q: 'Implement a basic RAG pipeline.', tags: ['CRITICAL'], a: `<pre class="code-block"><code>from openai import OpenAI
import numpy as np

client = OpenAI()
EMBED_MODEL = "text-embedding-3-small"

def embed(texts: list[str]) -> np.ndarray:
    # Batch — one call per text is the most common perf mistake here
    resp = client.embeddings.create(model=EMBED_MODEL, input=texts)
    return np.array([d.embedding for d in resp.data], dtype=np.float32)

class RAG:
    def __init__(self):
        self.chunks: list[str] = []
        self.vectors: np.ndarray | None = None

    def index(self, chunks: list[str], batch_size: int = 128):
        self.chunks = chunks
        vecs = [embed(chunks[i:i+batch_size])
                for i in range(0, len(chunks), batch_size)]
        v = np.vstack(vecs)
        # Normalize once so cosine == dot product at query time
        self.vectors = v / np.linalg.norm(v, axis=1, keepdims=True)

    def retrieve(self, query: str, k: int = 5) -> list[tuple[str, float]]:
        q = embed([query])[0]
        q /= np.linalg.norm(q)
        scores = self.vectors @ q            # cosine, vectorized
        idx = np.argpartition(-scores, k)[:k]  # O(n), not a full sort
        idx = idx[np.argsort(-scores[idx])]
        return [(self.chunks[i], float(scores[i])) for i in idx]

    def answer(self, query: str, k: int = 5, min_score: float = 0.25) -> str:
        hits = self.retrieve(query, k)
        if not hits or hits[0][1] &lt; min_score:
            return "I don't have enough information to answer that."
        context = "\\n\\n".join(f"[{i+1}] {c}" for i, (c, _) in enumerate(hits))
        resp = client.chat.completions.create(
            model="claude-sonnet-5", temperature=0,
            messages=[
                {"role": "system", "content":
                 "Answer ONLY from the context. Cite sources as [n]. "
                 "If the context is insufficient, say so."},
                {"role": "user", "content": f"Context:\\n{context}\\n\\nQuestion: {query}"},
            ])
        return resp.choices[0].message.content</code></pre><strong>What interviewers look for:</strong> batched embedding calls, normalizing once at index time so retrieval is a single matrix multiply, <code>argpartition</code> instead of a full sort, an <strong>abstention threshold</strong> so weak retrieval refuses rather than hallucinating, temperature 0, and citations. Mention that production needs a real ANN index, hybrid search, and reranking.` },

{ q: 'Build a simple AI agent with tool use.', tags: ['CRITICAL'], a: `<pre class="code-block"><code>import json, math
from openai import OpenAI

client = OpenAI()

def calculator(expression: str) -> str:
    # Never eval() model output. Whitelist explicitly.
    allowed = {k: v for k, v in vars(math).items() if not k.startswith("_")}
    try:
        return str(eval(expression, {"__builtins__": {}}, allowed))
    except Exception as e:
        return f"Error: {e}. Use Python syntax, e.g. '2 * math.pi'."

TOOLS = {"calculator": calculator}
SCHEMAS = [{
    "type": "function",
    "function": {
        "name": "calculator",
        "description": "Evaluate a math expression. Use for ANY arithmetic — "
                       "do not compute mentally. Not for symbolic algebra.",
        "parameters": {
            "type": "object",
            "properties": {"expression": {
                "type": "string",
                "description": "Python math expression, e.g. '2 * math.pi * 5'"}},
            "required": ["expression"],
        },
    }}]

def run(task: str, max_steps: int = 8) -> str:
    messages = [{"role": "user", "content": task}]
    for _ in range(max_steps):                      # hard budget, always
        resp = client.chat.completions.create(
            model="claude-sonnet-5", messages=messages,
            tools=SCHEMAS, temperature=0)
        msg = resp.choices[0].message
        messages.append(msg)
        if not msg.tool_calls:
            return msg.content
        for call in msg.tool_calls:
            try:
                args = json.loads(call.function.arguments)
                result = TOOLS[call.function.name](**args)
            except Exception as e:
                result = f"Error: {e}"              # errors go back as observations
            messages.append({"role": "tool",
                             "tool_call_id": call.id, "content": str(result)})
    return "Step budget exhausted before completing the task."</code></pre><strong>The details that matter:</strong> a hard step budget (non-negotiable — without it a failure mode becomes an unbounded bill), no <code>eval</code> on raw model output, errors returned as <em>actionable observations</em> rather than raised, "when not to use" in the tool description, and graceful termination that reports partial progress instead of fabricating.` },

{ q: 'Implement semantic search with cosine similarity.', tags: [], a: `<pre class="code-block"><code>import numpy as np

class SemanticSearch:
    def __init__(self, embed_fn):
        self.embed_fn = embed_fn
        self.docs: list[str] = []
        self.matrix: np.ndarray | None = None

    def add(self, docs: list[str]):
        vecs = self.embed_fn(docs).astype(np.float32)
        # Normalize at index time: cosine reduces to a dot product
        vecs /= np.linalg.norm(vecs, axis=1, keepdims=True) + 1e-10
        self.docs.extend(docs)
        self.matrix = vecs if self.matrix is None else np.vstack([self.matrix, vecs])

    def search(self, query: str, k: int = 5) -> list[tuple[str, float]]:
        if self.matrix is None:
            return []
        q = self.embed_fn([query])[0].astype(np.float32)
        q /= np.linalg.norm(q) + 1e-10
        scores = self.matrix @ q               # (n, d) @ (d,) -> (n,)
        k = min(k, len(self.docs))
        idx = np.argpartition(-scores, k - 1)[:k]   # O(n) partial select
        idx = idx[np.argsort(-scores[idx])]         # sort only the k
        return [(self.docs[i], float(scores[i])) for i in idx]</code></pre><strong>The three things being tested:</strong><br>• <strong>Normalize once at index time</strong>, not per query — then cosine similarity is a plain dot product, and the whole search is one BLAS matrix-vector multiply.<br>• <strong><code>argpartition</code> not <code>argsort</code></strong> — O(n) versus O(n log n). At a million documents this is the difference between 5ms and 80ms.<br>• <strong>Epsilon in the denominator</strong> — a zero vector (empty string) otherwise produces NaN that silently poisons every subsequent score.<br><br><strong>Say what this does not scale to:</strong> brute force is O(n·d) per query and fine to roughly 100k vectors. Beyond that you need an ANN index (HNSW/IVF), and beyond a few million you need quantization to keep it in RAM.` },

{ q: 'Write code for different chunking strategies.', tags: [], a: `<pre class="code-block"><code>import re

def fixed_size(text: str, size: int = 500, overlap: int = 50) -> list[str]:
    step = size - overlap
    if step &lt;= 0:
        raise ValueError("overlap must be smaller than size")
    return [text[i:i+size] for i in range(0, len(text), step)]

def recursive(text: str, size: int = 500, overlap: int = 50,
              seps: tuple[str, ...] = ("\\n\\n", "\\n", ". ", " ", "")) -> list[str]:
    """Split on the most semantic separator that yields pieces under 'size'."""
    if len(text) &lt;= size:
        return [text] if text.strip() else []
    sep = next((s for s in seps if s and s in text), "")
    if not sep:                                   # no separator left: hard cut
        return fixed_size(text, size, overlap)
    parts, chunks, buf = text.split(sep), [], ""
    for p in parts:
        candidate = buf + sep + p if buf else p
        if len(candidate) &lt;= size:
            buf = candidate
        else:
            if buf:
                chunks.append(buf)
            # A single part may still exceed size -> recurse with finer seps
            buf = p if len(p) &lt;= size else ""
            if len(p) &gt; size:
                chunks.extend(recursive(p, size, overlap, seps[seps.index(sep)+1:]))
    if buf:
        chunks.append(buf)
    return chunks

def semantic(sentences: list[str], embed_fn, threshold: float = 0.75) -> list[str]:
    """Break where consecutive-sentence similarity drops (topic shift)."""
    import numpy as np
    v = embed_fn(sentences)
    v = v / (np.linalg.norm(v, axis=1, keepdims=True) + 1e-10)
    chunks, cur = [], [sentences[0]]
    for i in range(1, len(sentences)):
        if float(v[i] @ v[i-1]) &lt; threshold:      # topic boundary
            chunks.append(" ".join(cur)); cur = []
        cur.append(sentences[i])
    return chunks + [" ".join(cur)] if cur else chunks</code></pre><strong>What to say alongside the code:</strong> recursive splitting is the right default — nearly all the benefit of structure-awareness at none of semantic chunking's cost. Semantic chunking needs an embedding pass over the whole corpus at ingest and gains are inconsistent. And note that <strong>parent-child retrieval usually beats better boundary detection</strong>, because it fixes the real precision/context tradeoff rather than optimizing where the cut lands.` },

{ q: 'Implement a prompt template system.', tags: [], a: `<pre class="code-block"><code>import re, hashlib
from dataclasses import dataclass, field

@dataclass(frozen=True)
class PromptTemplate:
    name: str
    version: str
    template: str
    required: frozenset[str] = field(default_factory=frozenset)

    def __post_init__(self):
        found = frozenset(re.findall(r"\\{\\{(\\w+)\\}\\}", self.template))
        object.__setattr__(self, "required", found)

    @property
    def hash(self) -> str:
        return hashlib.sha256(self.template.encode()).hexdigest()[:12]

    def render(self, **kwargs) -> str:
        missing = self.required - kwargs.keys()
        if missing:                       # fail loudly, never silently blank
            raise ValueError(f"{self.name}: missing variables {sorted(missing)}")
        out = self.template
        for key, value in kwargs.items():
            if value is None or (isinstance(value, str) and not value.strip()):
                raise ValueError(f"{self.name}: variable '{key}' is empty")
            out = out.replace("{{" + key + "}}", str(value))
        return out

# Untrusted content gets delimited, never interpolated bare
def wrap_untrusted(text: str, tag: str = "document") -&gt; str:
    safe = text.replace(f"&lt;/{tag}&gt;", "")   # prevent tag-break injection
    return f"&lt;{tag}&gt;\\n{safe}\\n&lt;/{tag}&gt;"

SUMMARIZE = PromptTemplate(
    name="summarize", version="v3",
    template="Summarize the document in {{max_words}} words.\\n\\n{{document}}")</code></pre><strong>The design points interviewers are probing:</strong> <strong>fail loudly on missing or empty variables</strong> — silently rendering a blank is the single most common cause of "the model ignored my instructions," and it is undebuggable without this check. Templates are <strong>immutable and versioned</strong>, with a content hash logged per request so any output is reproducible. Untrusted content is <strong>delimited</strong>, not concatenated. And put static content first so the prefix stays cacheable.` },

{ q: 'Build an evaluation pipeline using LLM-as-a-judge.', tags: ['CRITICAL'], a: `<pre class="code-block"><code>import json, random, statistics
from dataclasses import dataclass

JUDGE_PROMPT = """Compare two answers to the same question.

Question: {question}
Reference (ground truth): {reference}

Answer A: {a}
Answer B: {b}

Judge on factual accuracy first, then completeness, then clarity.
Ignore length and formatting differences.
Respond with JSON only: {{"winner": "A"|"B"|"tie", "reason": "&lt;one sentence&gt;"}}"""

@dataclass
class Result:
    wins: int; losses: int; ties: int
    @property
    def win_rate(self) -&gt; float:
        n = self.wins + self.losses + self.ties
        return self.wins / n if n else 0.0

def judge_pair(client, question, reference, out_a, out_b) -&gt; str:
    """Run BOTH orderings to cancel position bias."""
    verdicts = []
    for first, second, flipped in ((out_a, out_b, False), (out_b, out_a, True)):
        r = client.chat.completions.create(
            model="claude-sonnet-5", temperature=0,
            response_format={"type": "json_object"},
            messages=[{"role": "user", "content": JUDGE_PROMPT.format(
                question=question, reference=reference, a=first, b=second)}])
        w = json.loads(r.choices[0].message.content)["winner"]
        if flipped and w in ("A", "B"):
            w = "B" if w == "A" else "A"       # un-flip back to original labels
        verdicts.append(w)
    return verdicts[0] if verdicts[0] == verdicts[1] else "tie"  # disagree -&gt; tie

def evaluate(client, dataset, system_a, system_b) -&gt; Result:
    res = Result(0, 0, 0)
    for case in dataset:
        w = judge_pair(client, case["question"], case.get("reference", "N/A"),
                       system_a(case["question"]), system_b(case["question"]))
        setattr(res, {"A": "wins", "B": "losses", "tie": "ties"}[w],
                getattr(res, {"A": "wins", "B": "losses", "tie": "ties"}[w]) + 1)
    return res</code></pre><strong>The three things that make this a real evaluation rather than a toy:</strong> <strong>pairwise comparison</strong> (judges are far more reliable at "which is better" than at absolute 1–10 scores), <strong>both orderings evaluated and disagreement resolved as a tie</strong> — position bias is large and this cancels it, and <strong>explicit instruction to ignore length</strong>, since verbosity bias is well documented. Add that you must <strong>validate the judge against human labels</strong> before trusting the numbers.` },

{ q: 'Implement streaming responses for an LLM API.', tags: [], a: `<pre class="code-block"><code>from fastapi import FastAPI
from fastapi.responses import StreamingResponse
import json, asyncio

app = FastAPI()

async def token_stream(client, messages):
    buffer = ""
    try:
        stream = await client.chat.completions.create(
            model="claude-sonnet-5", messages=messages, stream=True)
        async for chunk in stream:
            delta = chunk.choices[0].delta.content
            if not delta:
                continue
            buffer += delta
            yield f"data: {json.dumps({'delta': delta})}\\n\\n"
    except asyncio.CancelledError:
        # Client disconnected — stop paying for tokens nobody receives
        raise
    except Exception as e:
        # 200 was already sent: errors must travel in-band
        yield f"data: {json.dumps({'error': str(e)})}\\n\\n"
    finally:
        yield f"data: {json.dumps({'done': True})}\\n\\n"

@app.post("/chat")
async def chat(body: dict):
    return StreamingResponse(
        token_stream(client, body["messages"]),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",   # critical: disables nginx buffering
        })</code></pre><strong>The details that separate working streaming from a demo:</strong><br>• <strong><code>X-Accel-Buffering: no</code></strong> — proxies buffer by default, which silently defeats streaming. This is the #1 cause of "it streams locally but not in production."<br>• <strong>In-band errors</strong> — the 200 status is already sent when a mid-stream failure occurs, so the HTTP status cannot convey it.<br>• <strong>Handle <code>CancelledError</code></strong> — a client disconnect must cancel upstream generation, or you keep paying.<br>• <strong>A terminal <code>done</code> event</strong> so the client can distinguish completion from a dropped connection.<br><br><strong>Mention the tradeoff:</strong> you cannot schema-validate or moderate what you have not finished generating — so buffer at sentence granularity for moderation, or stream free-form text only.` },

{ q: 'Build a vector similarity search from scratch.', tags: [], a: `<pre class="code-block"><code>import numpy as np
import heapq

class BruteForceIndex:
    """O(n·d) per query. Correct baseline — fine to ~100k vectors."""
    def __init__(self, dim: int):
        self.dim = dim
        self.vectors = np.empty((0, dim), dtype=np.float32)
        self.ids: list = []

    def add(self, ids: list, vecs: np.ndarray):
        vecs = np.asarray(vecs, dtype=np.float32)
        vecs = vecs / (np.linalg.norm(vecs, axis=1, keepdims=True) + 1e-10)
        self.vectors = np.vstack([self.vectors, vecs])
        self.ids.extend(ids)

    def search(self, query: np.ndarray, k: int = 10):
        q = np.asarray(query, dtype=np.float32)
        q = q / (np.linalg.norm(q) + 1e-10)
        scores = self.vectors @ q
        k = min(k, len(self.ids))
        idx = np.argpartition(-scores, k - 1)[:k]
        idx = idx[np.argsort(-scores[idx])]
        return [(self.ids[i], float(scores[i])) for i in idx]

class IVFIndex:
    """Inverted file: cluster, then search only the nearest 'nprobe' cells."""
    def __init__(self, dim: int, n_clusters: int = 64):
        self.dim, self.n_clusters = dim, n_clusters
        self.centroids = None
        self.cells: dict[int, list] = {}

    def build(self, ids: list, vecs: np.ndarray, iters: int = 15):
        from scipy.cluster.vq import kmeans2
        v = vecs / (np.linalg.norm(vecs, axis=1, keepdims=True) + 1e-10)
        self.centroids, labels = kmeans2(v, self.n_clusters, minit="++", iter=iters)
        for i, lab in enumerate(labels):
            self.cells.setdefault(int(lab), []).append((ids[i], v[i]))

    def search(self, query, k: int = 10, nprobe: int = 4):
        q = query / (np.linalg.norm(query) + 1e-10)
        near = np.argsort(-(self.centroids @ q))[:nprobe]   # recall/latency dial
        heap = []
        for c in near:
            for doc_id, vec in self.cells.get(int(c), []):
                heapq.heappush(heap, (float(vec @ q), doc_id))
                if len(heap) &gt; k:
                    heapq.heappop(heap)
        return [(d, s) for s, d in sorted(heap, reverse=True)]</code></pre><strong>What to articulate:</strong> exact search is O(n) and degrades to a full scan in high dimensions — classical KD-trees fail above ~20 dims (curse of dimensionality), which is <em>why</em> ANN exists. <code>nprobe</code> is the explicit recall/latency dial, and the failure mode is silent: fewer probes returns worse results with no error. Note that <strong>HNSW is the production default</strong> (better recall/latency, higher memory) and that at scale quantization is mandatory.` },

{ q: 'Implement a conversation memory system.', tags: ['CRITICAL'], a: `<pre class="code-block"><code>from dataclasses import dataclass, field

@dataclass
class HybridMemory:
    """Recent turns verbatim + rolling summary + ALWAYS-injected facts."""
    max_recent: int = 10
    summary: str = ""
    recent: list[dict] = field(default_factory=list)
    facts: dict[str, str] = field(default_factory=dict)   # structured, not vectors

    def add(self, role: str, content: str):
        self.recent.append({"role": role, "content": content})
        if len(self.recent) &gt; self.max_recent:
            overflow = self.recent[: -self.max_recent]
            self.recent = self.recent[-self.max_recent :]
            self._compact(overflow)

    def _compact(self, turns: list[dict]):
        text = "\\n".join(f"{t['role']}: {t['content']}" for t in turns)
        # Summarize from ORIGINAL turns, and keep facts verbatim elsewhere,
        # so recursive summarization cannot erode them.
        self.summary = llm(
            f"Prior summary:\\n{self.summary}\\n\\nNew turns:\\n{text}\\n\\n"
            "Write an updated summary. Preserve decisions and constraints.")
        extracted = llm_json(
            f"Extract durable user facts (preferences, constraints, identity) "
            f"as flat JSON. Omit anything transient.\\n\\n{text}")
        self.facts.update(extracted)      # recency wins on conflict

    def build_context(self) -&gt; list[dict]:
        msgs = []
        if self.facts:                    # unconditional — never retrieved
            lines = "\\n".join(f"- {k}: {v}" for k, v in self.facts.items())
            msgs.append({"role": "system", "content": f"Known about user:\\n{lines}"})
        if self.summary:
            msgs.append({"role": "system",
                         "content": f"Earlier conversation:\\n{self.summary}"})
        return msgs + self.recent</code></pre><strong>The design decision being tested is the separation of the facts store.</strong> Putting "user is allergic to penicillin" in a vector store means it surfaces only when semantically similar to the query — a critical fact silently failing to appear. Structured facts are injected <em>unconditionally</em>; episodic content is retrieved. Also note: <strong>recursive summarization compounds loss</strong>, which is why facts are extracted verbatim rather than left to survive repeated re-summarization.` },

{ q: 'Write code to detect and handle hallucinations.', tags: ['CRITICAL'], a: `<pre class="code-block"><code>import re, json

def extract_claims(client, answer: str) -&gt; list[str]:
    r = client.chat.completions.create(
        model="claude-sonnet-5", temperature=0,
        response_format={"type": "json_object"},
        messages=[{"role": "user", "content":
            "Split into atomic factual claims. JSON: {\\"claims\\": [...]}\\n\\n" + answer}])
    return json.loads(r.choices[0].message.content)["claims"]

def check_grounded(client, claim: str, context: str) -&gt; str:
    r = client.chat.completions.create(
        model="claude-sonnet-5", temperature=0,
        response_format={"type": "json_object"},
        messages=[{"role": "user", "content":
            f"Context:\\n{context}\\n\\nClaim: {claim}\\n\\n"
            'Is the claim ENTAILED, CONTRADICTED, or NOT_MENTIONED by the context? '
            'JSON: {"verdict": "..."}'}])
    return json.loads(r.choices[0].message.content)["verdict"]

def verify_quotes(answer: str, context: str) -&gt; list[str]:
    """Cheapest, deterministic check: quoted spans must exist verbatim."""
    def norm(s): return re.sub(r"\\s+", " ", s).strip().lower()
    ctx = norm(context)
    return [q for q in re.findall(r'"([^"]{20,})"', answer) if norm(q) not in ctx]

def faithfulness(client, answer: str, context: str) -&gt; dict:
    fake_quotes = verify_quotes(answer, context)      # free, run first
    claims = extract_claims(client, answer)
    verdicts = [check_grounded(client, c, context) for c in claims]
    supported = sum(v == "ENTAILED" for v in verdicts)
    return {
        "score": supported / len(claims) if claims else 1.0,
        "unsupported": [c for c, v in zip(claims, verdicts) if v != "ENTAILED"],
        "fabricated_quotes": fake_quotes,
        "pass": not fake_quotes and supported == len(claims),
    }</code></pre><strong>The ordering matters:</strong> quote verification is deterministic, free, and catches the most damaging failure — a fabricated citation. Run it before spending judge calls. <strong>Decompose into atomic claims</strong> because a compound sentence can be half-supported and sentence-level checking misses that. <strong>Say what does not work:</strong> asking the model for its confidence (poorly calibrated on RLHF'd models) and ROUGE (cannot distinguish a faithful summary from a fluent fabrication).` },

{ q: 'Implement retry with exponential backoff.', tags: [], a: `<pre class="code-block"><code>import time, random, logging
from typing import Callable, TypeVar

T = TypeVar("T")

class NonRetryable(Exception): pass

def call_with_retry(fn: Callable[[], T], max_attempts: int = 5,
                    base: float = 1.0, cap: float = 60.0) -&gt; T:
    for attempt in range(max_attempts):
        try:
            return fn()
        except Exception as e:
            status = getattr(e, "status_code", None)
            # Do NOT retry what will fail identically
            if status in (400, 401, 403, 404) or isinstance(e, NonRetryable):
                raise
            if status == 422 or "content_filter" in str(e).lower():
                raise NonRetryable(f"Content filtered: {e}") from e
            if attempt == max_attempts - 1:
                raise

            # Honour server guidance when present
            retry_after = getattr(e, "retry_after", None)
            if retry_after:
                delay = float(retry_after)
            else:
                # Full jitter: prevents synchronized retry storms
                delay = random.uniform(0, min(cap, base * (2 ** attempt)))
            logging.warning("attempt %d failed (%s), sleeping %.2fs",
                            attempt + 1, status or type(e).__name__, delay)
            time.sleep(delay)

class CircuitBreaker:
    """Stop hammering a provider that is already down."""
    def __init__(self, threshold: int = 5, reset_after: float = 30.0):
        self.threshold, self.reset_after = threshold, reset_after
        self.failures, self.opened_at = 0, None

    def call(self, fn):
        if self.opened_at and time.time() - self.opened_at &lt; self.reset_after:
            raise NonRetryable("Circuit open")
        try:
            result = fn()
            self.failures, self.opened_at = 0, None
            return result
        except Exception:
            self.failures += 1
            if self.failures &gt;= self.threshold:
                self.opened_at = time.time()
            raise</code></pre><strong>The two details interviewers listen for:</strong> <strong>full jitter</strong> — without randomization, all clients retry in lockstep and thunder-herd the recovering service, turning a brief blip into a sustained outage. And <strong>classifying errors</strong> — retrying a 400 or a content-filter block is pure waste since it will fail identically. Add the circuit breaker: during an outage, aggressive retries consume your latency budget and make recovery slower.` },

{ q: 'Write a function-calling handler for an LLM API.', tags: [], a: `<pre class="code-block"><code>import json, inspect
from typing import Callable, get_type_hints

class ToolRegistry:
    def __init__(self):
        self.tools: dict[str, Callable] = {}
        self.schemas: list[dict] = []

    def register(self, description: str, **param_docs):
        def decorator(fn: Callable):
            hints = get_type_hints(fn)
            sig = inspect.signature(fn)
            py2json = {str: "string", int: "integer",
                       float: "number", bool: "boolean"}
            props, required = {}, []
            for name, param in sig.parameters.items():
                props[name] = {
                    "type": py2json.get(hints.get(name, str), "string"),
                    "description": param_docs.get(name, ""),
                }
                if param.default is inspect.Parameter.empty:
                    required.append(name)
            self.tools[fn.__name__] = fn
            self.schemas.append({"type": "function", "function": {
                "name": fn.__name__, "description": description,
                "parameters": {"type": "object", "properties": props,
                               "required": required}}})
            return fn
        return decorator

    def execute(self, name: str, raw_args: str) -&gt; str:
        """Every failure returns an ACTIONABLE message, never an exception."""
        fn = self.tools.get(name)
        if fn is None:
            return (f"Error: unknown tool '{name}'. "
                    f"Available: {sorted(self.tools)}")
        try:
            args = json.loads(raw_args)
        except json.JSONDecodeError as e:
            return f"Error: arguments were not valid JSON ({e})."
        try:
            bound = inspect.signature(fn).bind(**args)   # validates names/arity
        except TypeError as e:
            return f"Error: {e}. Expected parameters: {list(
                inspect.signature(fn).parameters)}"
        try:
            return str(fn(*bound.args, **bound.kwargs))
        except Exception as e:
            return f"Error executing {name}: {e}"</code></pre><strong>The load-bearing idea: errors are prompts.</strong> "Error: unknown tool 'search_web'. Available: ['web_search', 'calculator']" gets repaired on the next turn; a raised exception or a bare 400 produces a retry loop of equally wrong guesses. Improving error-message quality typically does more for agent reliability than a model upgrade. Also note: validate arguments in code before execution, and enforce authorization here against the <em>authenticated user</em>, never the model's stated intent.` },

{ q: 'Implement a simple re-ranker.', tags: [], a: `<pre class="code-block"><code>from sentence_transformers import CrossEncoder
import numpy as np

class Reranker:
    def __init__(self, model_name="cross-encoder/ms-marco-MiniLM-L-6-v2"):
        self.model = CrossEncoder(model_name)

    def rerank(self, query: str, docs: list[str], top_k: int = 5,
               min_score: float | None = None) -&gt; list[tuple[str, float]]:
        if not docs:
            return []
        # Cross-encoder scores (query, doc) JOINTLY — no precomputation possible
        pairs = [(query, d) for d in docs]
        scores = self.model.predict(pairs, batch_size=32)
        order = np.argsort(-scores)[:top_k]
        out = [(docs[i], float(scores[i])) for i in order]
        if min_score is not None:                # calibrated abstention gate
            out = [(d, s) for d, s in out if s &gt;= min_score]
        return out

def mmr(query_vec, doc_vecs, docs, k=5, lam=0.7):
    """Maximal Marginal Relevance: relevance minus redundancy."""
    sim_q = doc_vecs @ query_vec
    selected, remaining = [], list(range(len(docs)))
    while len(selected) &lt; k and remaining:
        if not selected:
            best = max(remaining, key=lambda i: sim_q[i])
        else:
            best = max(remaining, key=lambda i: lam * sim_q[i] - (1 - lam) *
                       max(doc_vecs[i] @ doc_vecs[j] for j in selected))
        selected.append(best); remaining.remove(best)
    return [docs[i] for i in selected]</code></pre><strong>Explain the two-stage architecture:</strong> a bi-encoder compresses each document into a vector <em>without seeing the query</em>, so all interaction collapses to one dot product. A cross-encoder attends over query and document jointly, capturing term interaction, negation, and conditional relevance — far more accurate, but it requires a forward pass per pair with nothing precomputable, so it can only run over ~50–100 candidates.<br><br><strong>Two benefits worth naming:</strong> reranking is typically the highest-ROI addition to naive RAG, and its score is <em>far better calibrated</em> than embedding cosine similarity — making it the right signal for an abstention threshold.` },

{ q: 'Build a document parser that extracts and chunks PDFs.', tags: [], a: `<pre class="code-block"><code>import fitz  # PyMuPDF
import re
from dataclasses import dataclass

@dataclass
class Chunk:
    text: str
    page: int
    section: str
    doc_id: str

def parse_pdf(path: str, doc_id: str) -&gt; list[dict]:
    """Extract text WITH layout awareness and page provenance."""
    doc = fitz.open(path)
    pages = []
    for n, page in enumerate(doc, start=1):
        # "blocks" preserves reading order far better than raw text extraction
        blocks = page.get_text("blocks")
        blocks.sort(key=lambda b: (round(b[1]), b[0]))   # top-to-bottom, left-to-right
        text = "\\n".join(b[4] for b in blocks if b[4].strip())
        tables = [t.to_markdown() for t in page.find_tables()]  # keep as tables
        pages.append({"page": n, "text": text, "tables": tables})
    doc.close()
    return pages

def chunk_pages(pages: list[dict], doc_id: str,
                size: int = 800, overlap: int = 100) -&gt; list[Chunk]:
    chunks, section = [], ""
    for p in pages:
        for tbl in p["tables"]:                    # tables stay whole
            chunks.append(Chunk(tbl, p["page"], section, doc_id))
        for para in re.split(r"\\n\\s*\\n", p["text"]):
            para = re.sub(r"\\s+", " ", para).strip()
            if not para:
                continue
            if re.match(r"^(\\d+\\.|[A-Z][A-Z\\s]{4,})$", para):   # heading heuristic
                section = para
                continue
            # Prepend section so the chunk is self-describing when retrieved
            body = f"[{section}] {para}" if section else para
            if len(body) &lt;= size:
                chunks.append(Chunk(body, p["page"], section, doc_id))
            else:
                step = size - overlap
                for i in range(0, len(body), step):
                    chunks.append(Chunk(body[i:i+size], p["page"], section, doc_id))
    return chunks</code></pre><strong>The points that matter more than the code:</strong> PDF is a <em>rendering</em> format storing glyph positions, not structure — naive <code>get_text()</code> interleaves multi-column layouts and destroys tables. Use block extraction sorted by position, keep tables as markdown, and carry <strong>page and section provenance</strong> so citations can deep-link. Prepending the section heading makes each chunk self-describing, which measurably improves retrieval.<br><br><strong>Say the honest thing:</strong> for complex layouts, rendering pages and using a VLM to transcribe to markdown beats geometric heuristics — and always read the extracted text for a sample before building on it.` },

{ q: 'Implement similarity functions from scratch.', tags: [], a: `<pre class="code-block"><code>import numpy as np

def dot_product(a, b):
    return float(np.dot(a, b))

def cosine_similarity(a, b, eps=1e-10):
    """Angle only — magnitude-invariant. Range [-1, 1]."""
    na, nb = np.linalg.norm(a), np.linalg.norm(b)
    return float(np.dot(a, b) / (na * nb + eps))     # eps: zero-vector guard

def euclidean_distance(a, b):
    return float(np.linalg.norm(np.asarray(a) - np.asarray(b)))

# --- Batched forms: what you actually use in production ---

def cosine_batch(query: np.ndarray, matrix: np.ndarray) -&gt; np.ndarray:
    """One query vs n documents, vectorized."""
    q = query / (np.linalg.norm(query) + 1e-10)
    m = matrix / (np.linalg.norm(matrix, axis=1, keepdims=True) + 1e-10)
    return m @ q                                     # single BLAS call

def euclidean_batch(query: np.ndarray, matrix: np.ndarray) -&gt; np.ndarray:
    """||a-b||^2 = ||a||^2 + ||b||^2 - 2a·b  — avoids materializing diffs."""
    return np.sqrt(np.maximum(
        (matrix ** 2).sum(axis=1) + (query ** 2).sum() - 2 * (matrix @ query), 0))</code></pre><strong>The relationship to state — it is the actual insight:</strong> for <strong>L2-normalized</strong> vectors all three are monotonically equivalent. Cosine equals the dot product, and Euclidean distance becomes <code>sqrt(2 - 2·cos)</code>, a decreasing function of it — so <em>ranking is identical</em>. Since most text embedders normalize their output, the choice is usually a performance decision, not a quality one.<br><br><strong>The three implementation details being tested:</strong> the epsilon guard (a zero vector otherwise yields NaN that silently poisons every score), <strong>normalize once at index time</strong> so queries are a single matrix-vector product, and the expanded Euclidean identity that avoids materializing an n×d difference matrix.<br><br><strong>What actually matters in practice:</strong> use the metric the model was <em>trained</em> with, and configure the index to match — a mismatch gives quietly wrong rankings with no error.` },

{ q: 'Write code for token counting and context window management.', tags: ['CRITICAL'], a: `<pre class="code-block"><code>import tiktoken

class ContextBudget:
    def __init__(self, model="gpt-4o", limit=128_000, reserve_output=4_000):
        self.enc = tiktoken.encoding_for_model(model)
        self.limit = limit
        self.available = limit - reserve_output   # ALWAYS reserve for output

    def count(self, text: str) -&gt; int:
        return len(self.enc.encode(text))

    def count_messages(self, messages: list[dict]) -&gt; int:
        # ~4 tokens overhead per message for role/delimiter tokens
        return sum(self.count(m["content"]) + 4 for m in messages) + 3

    def fit_chunks(self, chunks: list[str], budget: int) -&gt; list[str]:
        """Greedily fit whole chunks — never emit a truncated chunk."""
        out, used = [], 0
        for c in chunks:
            n = self.count(c)
            if used + n &gt; budget:
                break                              # stop, don't slice mid-chunk
            out.append(c); used += n
        return out

    def assemble(self, system: str, history: list[dict],
                 chunks: list[str], query: str) -&gt; list[dict]:
        fixed = self.count(system) + self.count(query)
        if fixed &gt; self.available:
            raise ValueError("System prompt + query alone exceed the budget")

        remaining = self.available - fixed
        chunk_budget = int(remaining * 0.6)        # explicit split
        ctx = self.fit_chunks(chunks, chunk_budget)
        used_ctx = sum(self.count(c) for c in ctx)

        # Keep most RECENT history that fits in what's left
        kept, used_hist = [], 0
        for m in reversed(history):
            n = self.count(m["content"]) + 4
            if used_hist + n &gt; remaining - used_ctx:
                break
            kept.insert(0, m); used_hist += n

        context = "\\n\\n".join(f"[{i+1}] {c}" for i, c in enumerate(ctx))
        return ([{"role": "system", "content": system}] + kept +
                [{"role": "user", "content": f"Context:\\n{context}\\n\\nQ: {query}"}])</code></pre><strong>The three things that make this production code:</strong> <strong>reserve output tokens up front</strong> — the single most common bug is filling the window with input and getting a truncated generation; <strong>fit whole chunks</strong> rather than slicing mid-chunk, since a half-chunk is worse than none; and <strong>explicit per-component budgets</strong> so retrieved context cannot starve conversation history. Note that non-English text costs 2–3x more tokens, so budgets that fit in English may truncate elsewhere.` },

{ q: 'Build a prompt versioning system.', tags: [], a: `<pre class="code-block"><code>import hashlib, json
from dataclasses import dataclass, asdict
from pathlib import Path

@dataclass(frozen=True)
class PromptVersion:
    name: str
    version: str
    template: str
    model: str                     # prompt behaviour is model-specific
    params: dict                   # temperature, max_tokens, ...

    @property
    def fingerprint(self) -&gt; str:
        """Hash the FULL config — prompt alone is not reproducible."""
        blob = json.dumps(asdict(self), sort_keys=True)
        return hashlib.sha256(blob.encode()).hexdigest()[:16]

class PromptRegistry:
    """Prompts live in the repo, not a mutable database."""
    def __init__(self, directory: str):
        self.dir = Path(directory)
        self.cache: dict[str, PromptVersion] = {}

    def load(self, name: str, version: str) -&gt; PromptVersion:
        key = f"{name}@{version}"
        if key not in self.cache:
            data = json.loads((self.dir / f"{name}" / f"{version}.json").read_text())
            self.cache[key] = PromptVersion(name=name, version=version, **data)
        return self.cache[key]

    def render(self, name: str, version: str, **vars) -&gt; tuple[str, str]:
        pv = self.load(name, version)
        text = pv.template
        for k, v in vars.items():
            text = text.replace("{{" + k + "}}", str(v))
        if "{{" in text:                       # unresolved variable
            raise ValueError(f"{key_missing(text)} not provided for {name}@{version}")
        return text, pv.fingerprint            # log the fingerprint per request

def key_missing(text: str) -&gt; str:
    import re
    return str(re.findall(r"\\{\\{(\\w+)\\}\\}", text))</code></pre><strong>The design argument matters more than the code here.</strong> Prompts belong in <strong>version control, not a database</strong> — a database gives you fast iteration and no review, no history, no attribution, and no way to explain why quality dropped last Tuesday.<br><br><strong>Version the full configuration together</strong>: prompt, model, and parameters interact, so a prompt tuned for one model behaves differently on another. Log the <strong>fingerprint with every request</strong> so any output is traceable to an exact config. Gate changes on an eval run in CI — a prompt change is a behavior change, not a config tweak — and keep the previous version deployable for instant rollback.` },

{ q: 'Implement a caching layer for LLM responses.', tags: [], a: `<pre class="code-block"><code>import hashlib, json, time
from dataclasses import dataclass

@dataclass
class CacheEntry:
    value: str
    created_at: float
    ttl: float

class LLMCache:
    def __init__(self, backend, default_ttl: float = 3600):
        self.backend = backend           # Redis, or a dict for local use
        self.default_ttl = default_ttl
        self.hits = self.misses = 0

    def _key(self, messages: list[dict], model: str, params: dict,
             tenant: str, permission_scope: str) -&gt; str:
        """Tenant + permissions MUST be in the key, or answers leak across users."""
        payload = json.dumps({
            "messages": messages, "model": model,
            "params": {k: params[k] for k in sorted(params)},
            "tenant": tenant, "scope": permission_scope,
        }, sort_keys=True)
        return "llm:" + hashlib.sha256(payload.encode()).hexdigest()

    def get_or_call(self, fn, messages, model, params,
                    tenant: str, permission_scope: str, ttl: float | None = None):
        # Never cache non-deterministic generations
        if params.get("temperature", 0) &gt; 0:
            return fn()
        key = self._key(messages, model, params, tenant, permission_scope)
        cached = self.backend.get(key)
        if cached is not None:
            self.hits += 1
            return cached
        self.misses += 1
        value = fn()
        self.backend.set(key, value, ex=int(ttl or self.default_ttl))
        return value

    @property
    def hit_rate(self) -&gt; float:
        total = self.hits + self.misses
        return self.hits / total if total else 0.0</code></pre><strong>The two correctness requirements interviewers probe for:</strong> <strong>key by tenant and permission scope</strong> — an unkeyed cache leaks one user's answer to another, which in a RAG system with access control is a data breach, not a bug. And <strong>do not cache non-deterministic output</strong>: caching a temperature-0.8 generation returns a stale sample as though it were fresh.<br><br><strong>Position this against the higher-value layer:</strong> exact-match response caching has a low hit rate on natural language. <strong>Prompt/prefix caching</strong> is the bigger win — up to ~90% input cost reduction — and it requires ordering prompts static-content-first rather than any code here.` },

{ q: 'Implement semantic caching for LLM queries.', tags: ['TRADEOFF'], a: `<pre class="code-block"><code>import numpy as np

class SemanticCache:
    def __init__(self, embed_fn, threshold: float = 0.95, max_entries: int = 10_000):
        self.embed_fn = embed_fn
        self.threshold = threshold        # deliberately HIGH — see below
        self.max_entries = max_entries
        self.vectors = np.empty((0, 0), dtype=np.float32)
        self.entries: list[dict] = []

    def _embed(self, text: str) -&gt; np.ndarray:
        v = np.asarray(self.embed_fn([text])[0], dtype=np.float32)
        return v / (np.linalg.norm(v) + 1e-10)

    def get(self, query: str, tenant: str) -&gt; str | None:
        if not self.entries:
            return None
        q = self._embed(query)
        scores = self.vectors @ q
        # Only consider entries this tenant may see
        mask = np.array([e["tenant"] == tenant for e in self.entries])
        scores = np.where(mask, scores, -1.0)
        best = int(np.argmax(scores))
        if scores[best] &gt;= self.threshold:
            self.entries[best]["hits"] += 1
            return self.entries[best]["response"]
        return None

    def put(self, query: str, response: str, tenant: str):
        v = self._embed(query)
        if self.vectors.size == 0:
            self.vectors = v.reshape(1, -1)
        else:
            self.vectors = np.vstack([self.vectors, v])
        self.entries.append({"query": query, "response": response,
                             "tenant": tenant, "hits": 0})
        if len(self.entries) &gt; self.max_entries:      # evict least-used
            drop = int(np.argmin([e["hits"] for e in self.entries]))
            self.entries.pop(drop)
            self.vectors = np.delete(self.vectors, drop, axis=0)</code></pre><strong>Lead with the risk, because it is the point of the question:</strong> a semantic cache <em>false hit returns a wrong answer with no error</em>. "Cancel my order" and "don't cancel my order" have near-identical embeddings and opposite meanings — negation, numbers, dates, and entity names are exactly what embeddings compress away.<br><br><strong>Therefore:</strong> use a deliberately high threshold (0.95+, not the 0.85 that maximizes hit rate), restrict it to FAQ-like traffic, never apply it to personalized or time-sensitive queries, and key by tenant. <strong>Measure hit <em>quality</em>, not just hit rate</strong> — sample hits and verify appropriateness, or you have shipped a silent quality regression.` },

{ q: 'Write code to detect prompt injection attempts.', tags: ['CRITICAL'], a: `<pre class="code-block"><code>import re

SUSPICIOUS = [
    r"ignore\\s+(all\\s+)?(previous|prior|above)\\s+(instructions|prompts)",
    r"disregard\\s+(the\\s+)?(system|above|previous)",
    r"you\\s+are\\s+now\\s+(a|an|DAN)\\b",
    r"reveal|repeat|print|output.{0,20}(system\\s+prompt|instructions)",
    r"</?(system|assistant|user)>",         # role-tag injection
    r"\\[\\s*(INST|/INST|SYS)\\s*\\]",
]

def heuristic_scan(text: str) -&gt; list[str]:
    lowered = text.lower()
    hits = [p for p in SUSPICIOUS if re.search(p, lowered, re.I)]
    # Encoding evasion signals
    if re.search(r"[A-Za-z0-9+/]{60,}={0,2}", text):
        hits.append("possible base64 payload")
    if sum(ord(c) &gt; 0x2000 for c in text) &gt; len(text) * 0.1:
        hits.append("unusual unicode density")
    return hits

def classify(client, text: str) -&gt; bool:
    """LLM check for what regex cannot catch (paraphrase, novel phrasing)."""
    r = client.chat.completions.create(
        model="claude-sonnet-5", temperature=0, max_tokens=5,
        messages=[{"role": "user", "content":
            "Does the following text attempt to override an AI system's "
            "instructions, extract its prompt, or change its role? "
            "Answer YES or NO only.\\n\\n---\\n" + text[:4000]}])
    return r.choices[0].message.content.strip().upper().startswith("YES")

def wrap_untrusted(text: str, tag: str = "document") -&gt; str:
    """Delimit — and strip closing tags so content can't break out."""
    return f"&lt;{tag}&gt;\\n{re.sub(rf'&lt;/?{tag}&gt;', '', text)}\\n&lt;/{tag}&gt;"</code></pre><strong>Say the important thing plainly: none of this is a security boundary.</strong> Instructions and data share one token stream with no architectural separation — there is no parameterized-query equivalent — so every detector is a probabilistic filter a determined attacker gets past.<br><br><strong>Also scan <em>retrieved</em> content</strong>, not just user input. Indirect injection via a fetched page or document is the dangerous variant and the one teams forget.<br><br><strong>The real defense is architectural:</strong> assume injection succeeds and bound the blast radius — authorization enforced in the tool layer against the authenticated user, human approval for irreversible actions, and outbound domain allowlisting to kill the exfiltration channel.` },

{ q: 'Implement an output guardrails system.', tags: ['CRITICAL'], a: `<pre class="code-block"><code>import re
from dataclasses import dataclass

PII_PATTERNS = {
    "email": r"[\\w.+-]+@[\\w-]+\\.[\\w.]+",
    "ssn": r"\\b\\d{3}-\\d{2}-\\d{4}\\b",
    "credit_card": r"\\b(?:\\d[ -]*?){13,16}\\b",
    "phone": r"\\b\\+?\\d{1,2}[\\s.-]?\\(?\\d{3}\\)?[\\s.-]?\\d{3}[\\s.-]?\\d{4}\\b",
}

@dataclass
class GuardResult:
    allowed: bool
    output: str
    violations: list[str]

class OutputGuard:
    def __init__(self, allowed_domains: set[str], topic_check=None):
        self.allowed_domains = allowed_domains
        self.topic_check = topic_check

    def redact_pii(self, text: str) -&gt; tuple[str, list[str]]:
        found = []
        for label, pattern in PII_PATTERNS.items():
            if re.search(pattern, text):
                found.append(label)
                text = re.sub(pattern, f"[REDACTED_{label.upper()}]", text)
        return text, found

    def check_exfiltration(self, text: str) -&gt; list[str]:
        """Model-generated URLs are a classic data-exfiltration channel."""
        bad = []
        for url in re.findall(r"https?://([\\w.-]+)", text):
            if not any(url.endswith(d) for d in self.allowed_domains):
                bad.append(f"non-allowlisted domain: {url}")
        if re.search(r"!\\[.*?\\]\\(https?://", text):
            bad.append("markdown image (auto-fetch exfiltration risk)")
        return bad

    def apply(self, text: str, context: str = "") -&gt; GuardResult:
        violations = []
        text, pii = self.redact_pii(text)
        violations += [f"pii:{p}" for p in pii]
        violations += self.check_exfiltration(text)

        if self.topic_check and not self.topic_check(text):
            return GuardResult(False, "I can only help with topics related to "
                                      "this service.", violations + ["off_topic"])
        # Hard-fail on exfiltration; PII was already redacted in place
        blocked = any(v.startswith(("non-allowlisted", "markdown image"))
                      for v in violations)
        return GuardResult(not blocked, text, violations)</code></pre><strong>The check most people omit is exfiltration.</strong> A successful prompt injection typically needs a way <em>out</em> — a markdown image that the client auto-fetches, or a link encoding stolen data in the query string. Domain allowlisting kills the channel even when the injection lands, and ordinary content filters miss it entirely.<br><br><strong>Other points:</strong> regex PII detection is a backstop, not a guarantee — pair it with a proper detector (Presidio) and with access control at retrieval, which is the real fix. And <strong>log every trigger with the trace</strong>: a rising block rate is your earliest signal of an attack or a prompt regression.` },

{ q: 'Build a multi-agent system with different roles.', tags: ['TRADEOFF'], a: `<pre class="code-block"><code>from dataclasses import dataclass, field
import json

@dataclass
class Budget:
    max_steps: int = 20
    max_tokens: int = 100_000
    steps: int = 0
    tokens: int = 0
    def spend(self, tokens: int):
        self.steps += 1; self.tokens += tokens
        if self.steps &gt; self.max_steps or self.tokens &gt; self.max_tokens:
            raise RuntimeError("budget exhausted")

@dataclass
class Agent:
    name: str
    system_prompt: str
    tools: list = field(default_factory=list)

    def run(self, task: str, budget: Budget, client) -&gt; dict:
        """Isolated context; returns a STRUCTURED contract, not prose."""
        r = client.chat.completions.create(
            model="claude-sonnet-5", temperature=0,
            response_format={"type": "json_object"},
            messages=[
                {"role": "system", "content": self.system_prompt +
                 '\\nReturn JSON: {"findings": [...], "sources": [...], '
                 '"confidence": 0.0-1.0, "unresolved": [...]}'},
                {"role": "user", "content": task}])
        budget.spend(r.usage.total_tokens)      # GLOBAL budget, shared
        return json.loads(r.choices[0].message.content)

class Orchestrator:
    def __init__(self, agents: dict[str, Agent], client):
        self.agents, self.client = agents, client

    def run(self, goal: str) -&gt; dict:
        budget = Budget()                       # one budget for the whole run
        state = {"goal": goal, "results": {}}
        try:
            plan = self.agents["planner"].run(goal, budget, self.client)
            for subtask in plan["findings"]:    # independent -> parallelizable
                res = self.agents["researcher"].run(subtask, budget, self.client)
                state["results"][subtask] = res
            review = self.agents["critic"].run(
                json.dumps(state["results"]), budget, self.client)
            state["review"] = review
        except RuntimeError as e:
            state["terminated"] = str(e)        # partial results, not a lie
        return state</code></pre><strong>Lead with the honest framing:</strong> most tasks do not need multiple agents. This earns its place when subtasks are genuinely parallel or when <strong>context isolation</strong> is the binding constraint — a researcher can burn 60k tokens and return a 1k summary, keeping the orchestrator's context clean.<br><br><strong>The two implementation details that matter:</strong> a <strong>global budget held by the orchestrator</strong> — per-agent caps sum to unbounded under fan-out, which is how these systems produce surprise bills. And <strong>structured return contracts</strong> rather than prose: natural-language handoffs are lossy and unvalidatable, and that boundary is where errors compound silently.` },
]};
