#!/bin/bash

# bucket tests don't require setting anything up...
ab -n 1000 -c 1 http://example.com:8000/s/domain.com/b/cart/checkout
ab -n 1000 -c 1 http://example.com:8000/s/domain.com/b/listing/unclaimed
ab -n 1000 -c 1 http://example.com:8000/s/domain.com/p/t/page_test
ab -n 1000 -c 1 http://example.com:8000/s/domain.com/p/t/funnel_test
