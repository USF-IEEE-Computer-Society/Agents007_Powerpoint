-- Demo data for the resume kit: a spread of tech experiences across security,
-- cyber ops, software engineering, web, compilers, ML, embedded and systems.
--
-- Descriptions are written the way a student actually writes them — plain,
-- uneven, a few sentences — not as polished bullets. That is the point: the
-- tailoring chain has something real to work from.
--
-- Ids are fixed so re-running this adds nothing new.
--   just seed

INSERT INTO experiences
    (id, role, company, location, start_date, end_date, current, description)
VALUES
-- Security
('a1000000-0000-4000-8000-000000000001',
 'Application Security Intern', 'KnowBe4', 'Clearwater, FL',
 '2026-05', '2026-08', FALSE,
 'Worked with the product security team reviewing code for the phishing simulation platform. Went through findings from the static analysis scanner and figured out which ones were real. Wrote up three of them with reproduction steps. One was a stored XSS in a template field that got patched before release. Also helped write internal guidance on input validation for the Django services.'),

-- Cyber / SOC
('a1000000-0000-4000-8000-000000000002',
 'Security Operations Intern', 'ReliaQuest', 'Tampa, FL',
 '2025-05', '2025-08', FALSE,
 'Sat with the SOC triaging alerts on the GreyMatter platform. Mostly tier one — looking at alerts, checking if something was a real incident or noise, and escalating what mattered. Wrote Python scripts to pull indicators out of threat feeds so analysts did not have to do it by hand. Got familiar with Splunk queries and MITRE ATT&CK mapping.'),

-- Cyber / competition
('a1000000-0000-4000-8000-000000000003',
 'Team Member, Collegiate Cyber Defense Competition', 'USF Whitehatters Computer Security Club', 'Tampa, FL',
 '2025-09', '2026-03', FALSE,
 'Part of the eight person team for the Southeast regional. I owned the Linux boxes — hardening SSH, fixing permissions, pulling out backdoors the red team left, and keeping services up while they attacked. We had to write incident reports for the judges too. Placed fourth in the region.'),

-- Software engineering
('a1000000-0000-4000-8000-000000000004',
 'Software Engineering Intern', 'Jabil', 'St. Petersburg, FL',
 '2025-05', '2025-08', FALSE,
 'Built an internal dashboard for supply chain exceptions using React and FastAPI. Before this, planners were tracking exceptions in spreadsheets. Set up the Postgres schema, wrote the API, and did the frontend. Three plant teams picked it up by the end of the summer. Also wrote the first tests the repo had.'),

-- Web development
('a1000000-0000-4000-8000-000000000005',
 'Web Developer', 'IEEE Computer Society at USF', 'Tampa, FL',
 '2025-01', '', TRUE,
 'I maintain the chapter website and built the event check-in system we use at workshops and TechX. It is React on the frontend with a small Node backend, students scan a QR code and it records attendance. Used by around 300 students last year. Also redid the site so it works on phones, which it did not before.'),

-- Compilers
('a1000000-0000-4000-8000-000000000006',
 'Undergraduate Research Assistant, Compilers Group', 'USF Computer Science & Engineering', 'Tampa, FL',
 '2025-08', '', TRUE,
 'Working on an LLVM pass that looks for redundant bounds checks in loops and removes the ones it can prove are safe. Most of the work is writing test cases and running the pass against benchmark suites to check we did not break anything. Got about a 6 percent speedup on the benchmarks we targeted. Learning a lot of LLVM IR.'),

-- Compilers / coursework
('a1000000-0000-4000-8000-000000000007',
 'Course Project: Compiler for a C Subset', 'COP 4620 Compilers, USF', 'Tampa, FL',
 '2025-01', '2025-05', FALSE,
 'Built a full compiler in C++ for a subset of C. Wrote the lexer and a recursive descent parser by hand, then the AST, type checker, and a code generator that emits x86-64 assembly. Added constant folding and dead code elimination at the end. It compiles and runs the test programs the professor gave us.'),

-- Machine learning
('a1000000-0000-4000-8000-000000000008',
 'Undergraduate Research Assistant', 'USF Coastal Research Lab', 'Tampa, FL',
 '2024-08', '2025-05', FALSE,
 'Trained computer vision models to spot coastal erosion in drone imagery of Florida shorelines. Ran the training jobs on the Bulls HPC cluster. The hard part was labeling — we did not have many labeled images, so I built an active learning loop that picked which images were worth labeling next. Presented a poster at the undergraduate research symposium.'),

-- Embedded / IoT
('a1000000-0000-4000-8000-000000000009',
 'Workshop Lead, IoT and Electronics', 'IEEE Computer Society at USF', 'Tampa, FL',
 '2024-09', '2025-05', FALSE,
 'Ran the IoT and electronics repair workshops for the chapter. Wrote the material and taught ESP32 programming in C — sensors, WiFi, sending readings to a server. Usually 25 to 40 students showed up. Also built the demo project, a room sensor that logged temperature and humidity to a dashboard.'),

-- Cloud / DevOps
('a1000000-0000-4000-8000-00000000000a',
 'Student Developer', 'USF Research Computing', 'Tampa, FL',
 '2024-01', '2024-08', FALSE,
 'Helped move a few research group workflows onto containers. Wrote Dockerfiles, set up GitHub Actions so images built automatically, and wrote documentation so grad students could run things themselves instead of emailing us. Also did some Slurm job script cleanup on the cluster.'),

-- Databases / systems
('a1000000-0000-4000-8000-00000000000b',
 'Teaching Assistant, Data Structures', 'USF Computer Science & Engineering', 'Tampa, FL',
 '2024-08', '2025-05', FALSE,
 'TA for the data structures course. Held office hours twice a week, graded projects, and ran review sessions before exams. Spent most office hours helping students debug pointer and memory issues in C++. Wrote extra practice problems on trees and graphs that the professor kept for the next semester.')

ON CONFLICT (id) DO NOTHING;
