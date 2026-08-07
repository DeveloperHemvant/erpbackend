# PostgreSQL Query Plans Audit

## Query: student_joins
```text
Limit  (cost=401.50..412.07 rows=100 width=39) (actual time=7.649..7.879 rows=100.00 loops=1)
  Buffers: shared hit=198
  ->  Nested Loop Left Join  (cost=401.50..1417.61 rows=9609 width=39) (actual time=7.646..7.862 rows=100.00 loops=1)
        Buffers: shared hit=198
        ->  Nested Loop Left Join  (cost=401.35..1180.35 rows=9609 width=48) (actual time=7.614..7.763 rows=100.00 loops=1)
              Buffers: shared hit=194
              ->  Hash Left Join  (cost=401.20..932.79 rows=9609 width=46) (actual time=7.112..7.176 rows=100.00 loops=1)
                    Hash Cond: (s.id = se."studentId")
                    Buffers: shared hit=190
                    ->  Seq Scan on students s  (cost=0.00..410.33 rows=5033 width=30) (actual time=0.057..0.089 rows=50.00 loops=1)
                          Buffers: shared hit=5
                    ->  Hash  (cost=281.09..281.09 rows=9609 width=32) (actual time=6.924..6.924 rows=9609.00 loops=1)
                          Buckets: 16384  Batches: 1  Memory Usage: 729kB
                          Buffers: shared hit=185
                          ->  Seq Scan on student_enrollments se  (cost=0.00..281.09 rows=9609 width=32) (actual time=0.028..3.488 rows=9609.00 loops=1)
                                Buffers: shared hit=185
              ->  Memoize  (cost=0.15..0.17 rows=1 width=34) (actual time=0.001..0.001 rows=1.00 loops=100)
                    Cache Key: se."sectionId"
                    Cache Mode: logical
                    Hits: 98  Misses: 2  Evictions: 0  Overflows: 0  Memory Usage: 1kB
                    Buffers: shared hit=4
                    ->  Index Scan using sections_pkey on sections sec  (cost=0.14..0.16 rows=1 width=34) (actual time=0.030..0.030 rows=1.00 loops=2)
                          Index Cond: (id = se."sectionId")
                          Index Searches: 2
                          Buffers: shared hit=4
        ->  Memoize  (cost=0.15..0.36 rows=1 width=23) (actual time=0.001..0.001 rows=1.00 loops=100)
              Cache Key: sec."classId"
              Cache Mode: logical
              Hits: 98  Misses: 2  Evictions: 0  Overflows: 0  Memory Usage: 1kB
              Buffers: shared hit=4
              ->  Index Scan using classes_pkey on classes c  (cost=0.14..0.35 rows=1 width=23) (actual time=0.021..0.021 rows=1.00 loops=2)
                    Index Cond: (id = sec."classId")
                    Index Searches: 2
                    Buffers: shared hit=4
Planning:
  Buffers: shared hit=388 read=12 dirtied=2
Planning Time: 10.632 ms
Execution Time: 8.320 ms
```

## Query: attendance_aggregates
```text
Error: 
Invalid `prisma.$queryRawUnsafe()` invocation:


Raw query failed. Code: `42703`. Message: `column "sectionId" does not exist`
```

## Query: invoice_joins
```text
Limit  (cost=0.58..179.19 rows=100 width=37) (actual time=0.110..1.932 rows=100.00 loops=1)
  Buffers: shared hit=600
  ->  Nested Loop  (cost=0.58..2027.85 rows=1135 width=37) (actual time=0.109..1.914 rows=100.00 loops=1)
        Buffers: shared hit=600
        ->  Nested Loop  (cost=0.30..1504.51 rows=1135 width=39) (actual time=0.094..1.405 rows=100.00 loops=1)
              Buffers: shared hit=300
              ->  Seq Scan on fee_invoices fi  (cost=0.00..294.40 rows=1135 width=39) (actual time=0.027..0.229 rows=100.00 loops=1)
                    Filter: (status = 'Overdue'::text)
                    Rows Removed by Filter: 763
                    Buffers: shared hit=18
              ->  Memoize  (cost=0.30..1.12 rows=1 width=32) (actual time=0.011..0.011 rows=1.00 loops=100)
                    Cache Key: fi."enrollmentId"
                    Cache Mode: logical
                    Hits: 6  Misses: 94  Evictions: 0  Overflows: 0  Memory Usage: 14kB
                    Buffers: shared hit=282
                    ->  Index Scan using student_enrollments_pkey on student_enrollments se  (cost=0.29..1.11 rows=1 width=32) (actual time=0.011..0.011 rows=1.00 loops=94)
                          Index Cond: (id = fi."enrollmentId")
                          Index Searches: 94
                          Buffers: shared hit=282
        ->  Index Scan using students_pkey on students s  (cost=0.28..0.46 rows=1 width=30) (actual time=0.005..0.005 rows=1.00 loops=100)
              Index Cond: (id = se."studentId")
              Index Searches: 100
              Buffers: shared hit=300
Planning:
  Buffers: shared hit=97
Planning Time: 4.124 ms
Execution Time: 2.044 ms
```

