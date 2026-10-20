# Implementation and scope

The current application implements the learning workflow in the uploaded project:

| Role          | Implemented workflow                                                                                                                                                                                                                                       |
| ------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Visitor       | Published course catalog, search and level filters, registration and help                                                                                                                                                                                  |
| Student       | Student-only self-registration, login/logout, profile/password changes, course enrollment, ordered lessons, video/audio URLs, Markdown content, progress, exercises, timed exams with saved drafts, history, notifications, ordered learning paths         |
| Teacher       | Own courses and lessons, question/answer authoring, exercise publication, exam settings and question selection, enrollment approval, student progress, submissions, manual grades/feedback, learning paths with ordered courses, real dashboard statistics |
| Administrator | User creation/roles/password resets/locking, programs, all teacher content and submissions, platform statistics                                                                                                                                            |

SQLite foreign keys protect relations. Course ownership, enrollment, publication
and role permissions are checked on the server. Passwords use salted scrypt;
random session tokens are stored as SHA-256 hashes with expiry and revocation.
The first administrator is created explicitly, and self-registration never grants
teacher or administrator privileges. SQL queries bind user values as parameters.

Grades are computed on the server. Exam sessions use server deadlines, a snapshot
of questions, a maximum attempt count and idempotent submission. The browser
autosaves answers and resumes the same active session on reload. Expired sessions
are finalized from their saved answers on the next authenticated request, including
when the browser was closed. A five-second submission transport grace period does
not permit later draft changes. Teachers can disable exam solution review; that
setting applies to initial results, repeated submission and student history.

Single-choice and true/false questions use answer IDs. Fill-in, ordering and
matching currently accept a text response against teacher-defined answers; `|`
separates accepted variants, ignoring case and excess whitespace. They do not yet
have a drag-and-drop editor. Essays and speaking tasks wait for manual grading.
Speaking accepts a recording link or transcript; in-browser recording and media
upload/storage are not integrated. Lesson media also uses teacher-supplied URLs.

Paid courses use a pending enrollment and teacher approval after manual fee
confirmation. There is **no payment gateway, automatic billing or refunds**.
Password reset is performed by an administrator; outbound email, self-service
email recovery, email verification, live video classes, AI scoring and accredited
certificates are not integrated. These require separate service/provider choices
and credentials. The help page describes the current behavior without claiming
official accreditation.

The supplied sample course material is starter content stored in the database,
not a substitute for a professionally reviewed complete curriculum. Three courses,
six lessons, practice questions, three quizzes and one learning path are seeded
only by the explicit development demo command. Screens never substitute made-up
courses or grades for failed requests.

Historical SQL Server code remains in `legacy/sql-server/` for reference and is
not part of the supported runtime. The original local `.env` was retained in the
ignored `.data/original.env`; no original secret values are included in the new
configuration or instructions. Removing a file from this working tree does not
remove earlier copies from Git history.

This is a single-instance SQLite deployment. Production needs a persistent disk,
TLS at the reverse proxy, an independent non-demo database, a backup/restore plan,
appropriate support/privacy/fee policies and deployment-specific load validation.
Changing the storage backend or importing an existing SQL Server database is a
separate migration. No live service was deployed. The completed source is supplied on the
`codex/english-studio` branch for downloading and local development.
