
serve:
	sudo FLASK_APP=server.py nohup env/bin/flask run -h 0.0.0.0 -p 3000
	# $ sudo nohup python app1c.py > log.txt 2>&1 &

productionize:
	rm -rf prod
	mkdir -p prod
	python -m compileall -l .
	cp *.py prod/
	cp *.json prod/
	cp *.ttf prod/
	cp -r env prod/
	cp -r static prod/
	cp LICENSE prod/
	cp index.html prod/
	cp prodMakefile prod/Makefile

kill:
	sudo killall python || true
	sudo killall tx || true
	sudo killall flask || true
	sudo killall make || true
	sudo killall rx || true
