# TMZNS

TMZNS is a free, open-sourced timezone converter.

## This is now available at http://www.tmzns.com/ or as a [https://chrome.google.com/webstore/detail/fgkienloijjhkoegoacpnfknffgnlkde Chrome Web Store app].==

Finding out the actual time difference between two places is hard. There are online converters that can do that for you, but their user experience sucks. I always wondered why someone doesn't fix this -- until I ultimately decided to try & fix it myself.

And boy, was I surprised how hard this problem is! If you think this is a simple algorithm, think again. Timezones and daylight saving times around the world are a mess. Fortunately, the great people at [http://code.google.com/p/tzdata/ tzdata] are publishing an open-source database of all the info needed. So I was able to focus on user experience.

This is also an exercise of using Google's Closure Library & Compiler, which is why the code looks structured and everything "just works" (although, as always, YMMV).