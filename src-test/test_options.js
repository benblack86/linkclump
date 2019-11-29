/* eslint no-undef: 0 */

OptionTest = new TestCase("Option");

OptionTest.prototype.testDisplayKeys = function() {
    os = OS_WIN;
    assertNotEquals(displayKeys(1)[18], null);
    assertEquals(displayKeys(1)[91], null);

    os = OS_LINUX;
    assertEquals(displayKeys(1)[18], null);
    assertEquals(displayKeys(1)[91], null);
};