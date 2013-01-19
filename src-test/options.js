OptionTest = TestCase("Option");

OptionTest.prototype.testDisplayKeys = function() {
	os = OS_WIN;
	assertNotEquals(display_keys(1)[18], null);
	assertEquals(display_keys(1)[91], null);
	
	os = OS_LINUX
	assertEquals(display_keys(1)[18], null);
	assertEquals(display_keys(1)[91], null);
	
	os = OS_MAC
	assertNotEquals(display_keys(1)[18], null);
	assertNotEquals(display_keys(1)[91], null);
};