setup:
	npm ci
	npx playwright install --with-deps

test:
	npm run test:e2e

lint:
	npm run lint
 
