import sqlite3
import sys
sys.stdout.reconfigure(encoding='utf-8')

conn = sqlite3.connect('instance/medresearch.db')
cursor = conn.cursor()

# 테이블 목록 조회
cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
tables = cursor.fetchall()

print("=" * 60)
print("TABLE LIST")
print("=" * 60)
for t in tables:
    print(f"  - {t[0]}")

# 각 테이블의 구조 조회
for t in tables:
    table_name = t[0]
    print(f"\n{'=' * 60}")
    print(f"TABLE: {table_name}")
    print("=" * 60)
    
    cursor.execute(f"PRAGMA table_info({table_name})")
    columns = cursor.fetchall()
    
    print(f"{'Column':<30} {'Type':<15} {'NotNull':<10} {'Default':<15} {'PK'}")
    print("-" * 80)
    for col in columns:
        cid, name, col_type, notnull, default_val, pk = col
        null_str = "YES" if notnull else "NO"
        default_str = str(default_val) if default_val is not None else "-"
        pk_str = "PK" if pk else ""
        print(f"{name:<30} {col_type:<15} {null_str:<10} {default_str:<15} {pk_str}")
    
    # 데이터 개수 조회
    cursor.execute(f"SELECT COUNT(*) FROM {table_name}")
    count = cursor.fetchone()[0]
    print(f"\nTotal Records: {count}")

    # 샘플 데이터 (최대 3개)
    if count > 0:
        cursor.execute(f"SELECT * FROM {table_name} LIMIT 3")
        samples = cursor.fetchall()
        col_names = [col[1] for col in columns]
        print(f"\nSample Data (max 3 rows):")
        print("-" * 80)
        for sample in samples:
            for i, val in enumerate(sample):
                val_str = str(val)[:50] + "..." if len(str(val)) > 50 else str(val)
                print(f"  {col_names[i]}: {val_str}")
            print("-" * 40)

conn.close()
