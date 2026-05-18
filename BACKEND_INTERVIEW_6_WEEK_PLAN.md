# Backend Interview Track: Wallet Engine Edition

This plan mixes LeetCode-style patterns with production backend work. Each week has:

- Algorithm focus: 3 problems.
- Backend activity: one feature or hardening task.
- Tests to add: proof that the system survives real failure modes.
- Interview prompts: questions you should be able to explain out loud.

Use JavaScript for the algorithms so the practice transfers directly to Node.js interviews.

## Week 1: Hash Maps, Sets, and Idempotency

Algorithm focus:

- Two Sum
- Contains Duplicate
- Group Anagrams

Backend activity:

- Build a real `IdempotencyKey` table instead of only storing `idempotencyKey` on `Transaction`.
- Store `userId`, `key`, `route`, `requestHash`, `status`, `responseBody`, `expiresAt`, and timestamps.
- Reject the same key with a different request body using `409 Conflict`.

Tests to add:

- Same deposit key and same body returns the original response.
- Same key with different amount returns `409`.
- Same key can be reused safely by a different user.
- Same key on different routes does not collide.

Interview prompts:

- Why is idempotency necessary in payment systems?
- Why is a global unique idempotency key too weak?
- What is the difference between retry safety and duplicate prevention?

## Week 2: Strings, Validation, and API Contracts

Algorithm focus:

- Valid Anagram
- Valid Palindrome
- Longest Substring Without Repeating Characters

Backend activity:

- Add consistent error codes to API responses, for example `INSUFFICIENT_FUNDS`, `VALIDATION_ERROR`, `IDEMPOTENCY_CONFLICT`.
- Add request IDs and include them in responses and logs.
- Tighten validation for email, amount, idempotency key, pagination, and transaction type.

Tests to add:

- Invalid amount with more than 2 decimals is rejected.
- Scientific notation is rejected if unsupported.
- Error responses always include `success`, `message`, `code`, and `requestId`.
- Logs include request ID for failed requests.

Interview prompts:

- What makes a good public API error response?
- Why normalize emails before storage?
- What validation belongs in middleware vs service logic?

## Week 3: Arrays, Pagination, and Query Design

Algorithm focus:

- Best Time to Buy and Sell Stock
- Product of Array Except Self
- Merge Intervals

Backend activity:

- Replace page/limit transaction history with cursor pagination.
- Add indexes that support the query shape.
- Return `nextCursor` and stable ordering.

Tests to add:

- First page returns the newest transactions.
- `nextCursor` fetches the next page without duplicates.
- Pagination remains stable when a new transaction is inserted between requests.
- Invalid cursor returns `400`.

Interview prompts:

- Why can offset pagination become slow or inconsistent?
- What makes cursor pagination stable?
- Which database indexes support transaction history queries?

## Week 4: Stacks, Queues, and Background Jobs

Algorithm focus:

- Valid Parentheses
- Min Stack
- Evaluate Reverse Polish Notation

Backend activity:

- Add a simple job queue pattern for async work such as sending notifications or running reconciliation.
- Model retries, max attempts, and a dead-letter state.
- Keep wallet balance mutation synchronous; move side effects async.

Tests to add:

- Failed job retries up to max attempts.
- Permanently failed job moves to dead-letter state.
- Wallet transfer succeeds even if notification enqueue fails only when that side effect is non-critical.
- Critical jobs fail safely.

Interview prompts:

- When should work happen synchronously vs asynchronously?
- What is a dead-letter queue?
- How do you make background jobs idempotent?

## Week 5: Binary Search, Rate Limits, and Security

Algorithm focus:

- Binary Search
- Search Insert Position
- Search in Rotated Sorted Array

Backend activity:

- Add Redis-backed rate limiting for login and money-movement endpoints.
- Add `helmet`.
- Add CORS policy.
- Add account lockout or progressive delay for repeated login failures.

Tests to add:

- Login is rate-limited after repeated failures.
- Authenticated wallet operations have stricter limits than simple reads.
- Rate limit resets after the configured window.
- Security headers are present.

Interview prompts:

- How does a sliding-window rate limiter work?
- Why are login endpoints special?
- What should happen if Redis is down during rate limiting?

## Week 6: Graphs, Ledger Integrity, and Concurrency

Algorithm focus:

- Number of Islands
- Clone Graph
- Course Schedule

Backend activity:

- Add true ledger integrity checks.
- Add concurrent withdrawal and transfer tests.
- Introduce double-entry accounting concepts: wallet account, platform account, suspense account, and fee account.
- Enforce that debits equal credits for each completed movement.

Tests to add:

- Two simultaneous withdrawals cannot overdraw the wallet.
- Two simultaneous transfers preserve total system balance.
- Ledger entries for a transfer balance to zero.
- Wallet balance equals ledger-derived balance after deposits, withdrawals, and transfers.

Interview prompts:

- How do database transactions protect wallet balances?
- What is pessimistic locking?
- Why is double-entry accounting safer than mutable balances alone?

## Weekly Review Ritual

For each week, write short notes answering:

- What bug did my tests catch?
- What failure mode did I miss at first?
- Which data invariant matters most for this feature?
- How would I explain this design to a senior engineer?

By the end, you should have both algorithm pattern confidence and a serious backend portfolio project.
