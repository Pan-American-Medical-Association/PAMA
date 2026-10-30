import sys, os, json, gzip, math, zlib
sys.path.insert(0, 'tools/chat'); from textproc import tokens
D=sys.argv[1]
meta=json.load(gzip.open(D+'/meta.json.gz','rt'))
def search(q,k=4):
    qt=list(dict.fromkeys(tokens(q))); N=meta['N']; avg=meta['avgdl']; L=meta['len']; sc={}
    for t in qt:
        ps=json.load(gzip.open(D+'/p%02d.json.gz'%(zlib.crc32(t.encode())%meta['NP']),'rt')).get(t,[])
        df=len(ps)//2; idf=math.log(1+(N-df+.5)/(df+.5))
        for i in range(0,len(ps),2):
            d,tf=ps[i],ps[i+1]; sc[d]=sc.get(d,0)+idf*tf*2.2/(tf+1.2*(.25+.75*L[d]/avg))
    top=sorted(sc,key=sc.get,reverse=True)[:k]
    for d in top:
        c=json.load(gzip.open(D+'/c%02d.json.gz'%(d%meta['NC']),'rt'))[str(d)]
        s=meta['sources'][c[0]]; print('  %.1f | %s p.%s | %s | %s'%(sc[d],s['short'],c[1],c[2][:50],c[3][:90]))
for q in sys.argv[2:]: print('Q:',q); search(q)
