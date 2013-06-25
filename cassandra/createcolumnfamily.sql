CREATE TABLE "tracks"."schedules"  ( 
	"name"    	text,
	"track"   	text,
	"cost"    	text,
	"date"    	text,
	"groups"  	text,
	"notes"   	text,
	"services"	text,
	PRIMARY KEY("name","track")
) WITH
	"bloom_filter_fp_chance"='0.01' AND "caching"='KEYS_ONLY' AND "dclocal_read_repair_chance"='0.0' AND "gc_grace_seconds"='864000' AND "read_repair_chance"='0.1' AND "replicate_on_write"='true'
	AND compaction = {'class':'SizeTieredCompactionStrategy'}
	AND compression = {'sstable_compression':'SnappyCompressor'}
GO
