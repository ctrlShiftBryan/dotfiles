# Stop putting secrets in .env

| Field | Value |
|-------|-------|
| Channel | Syntax |
| Duration | 47:09 |
| Uploaded | 2026-03-09 |
| Views | 31,711 |
| URL | https://www.youtube.com/watch?v=M5IkdUunf8g |

## Transcript

Welcome to syntax. If you have av file sitting on your computer, this is the episode for you because we're going to talk to you about why you shouldn't be doing that. My name is Wes Boss and with us today we've got Theo Efim and Phil Miller. They work on Varlock, which is a solution, a library that'll help you inject your secrets into your app and into your coding agents.

But uh we also just want to like talk about just like why is everyone just putting like text files on their computer with all of their secrets when we have all of this um like logging into notion for me is like a ritual where I have to like use a thousand things and there's there's b pin codes and everything and then we just put the like database string in av file. So welcome guys. Thanks a lot for coming on. &gt;&gt; Yeah, thanks for having &gt;&gt; Thanks so much for having us.

So let's start there. Yeah. What's wrong with files? &gt;&gt; Yeah, I mean why don't we first just talk about like you know you have these files sitting there often you're putting plain text secrets in there and you know maybe you don't have any like super sensitive production secrets in there but you still probably have some or you know maybe you needed to run some script that connected to production so you put it in there once and you know you forget that the file is even there.

And you know, especially now in the era of AI coding agents where they're just reading all your files, slurping it all up, sending it off to some server, like the only real safe way to ensure that they're going to be not sent up to, you know, OpenAI is to get them out of plain text altogether. to go back a bit to to answer your question. I think the reason they're sitting in plain text is because every tutorial on the internet, the first step is put the secret in plain text in a file and then then do the rest of the tutorial. &gt;&gt; Um, so everyone is still telling people to do that even though we know that it's wrong and then we copy and paste those files on Slack, right?

&gt;&gt; I think that even the harder challenges is for the most part that most people don't even know of a different way to do it. Like that's just the way, right? &gt;&gt; Yeah. &gt;&gt; Or the way that the way the easier way or sorry, the right way is like such a pain, right?

Or has seat fees of, you know, $20 per developer per month. So it's like you're like, I could do it that way, but it's just not worth the hassle. And people like to say that they do, you know, security best practices even if they don't always do them, right? They're going to ch they're going to choose the path of least resistance, especially if it's a last minute thing, right?

&gt;&gt; Yeah. I I'll give you an example. Um, so, uh, me and Serge were working on the Mad CSS website and and he was sort of like scaffolding it out and building like kind of the first run of it. I had some like GitHub secrets that uh, for like the login, right?

and like I threw him in one password as an environment and then he went through it and he he say he spent like half a day just trying to like get them injected with the like one password CLI thing and then he ended up just being like &gt;&gt; screw it you know I can't get it to work with like these two specific things &gt;&gt; which I think happens probably more often um where people are just like ideally yes I would have something &gt;&gt; but it's it just doesn't work as well it doesn't work with my setup and whatnot. So like what is what what is the solution here? Like what should we be doing? &gt;&gt; So like let's also let's go back a second and just talk about like.ample because like regardless of how you're shoving stuff in there like the common way is like okay at least we have amp.ample that's clearly better than having nothing right.

It's clearly well arguably better than having it you know buried in a read me in a custom table but like what are the what are the problems there right? So like you open it up, it's a mix of half of them half of the values are real values that should be used, right? Like a port number or some feature flags or things like that and half of it is like a placeholder that's like your put your key here, you know, talk to Bob to provision a key, right? It's unclear which are real things to use.

It's unclear which are placeholders. Like the the utility of having an example there depending on the item is arguable. And then you copy paste this thing and now you suddenly have this like problem of trying to keep these two things in sync right you don't have a single source of truth. So like half of the you know there's documentation in that file there's also documentation in your validation code if you have it at all you maybe have type generation or maybe you're handmaintaining types.

So like all this stuff gets spread out all over the place to the point where you just say, you know what, if I can avoid using this at all, I'm going to So you don't put things that should be environment variables or just like sort of static config in there anymore. You just you just put them in const scattered all throughout your codebase. &gt;&gt; Dude, &gt;&gt; I you're just like speak you're doing you're speaking exactly what I do when I &gt;&gt; have you been looking at our code. Yeah.

So, so the solution there and this is kind of how var came into being is like, okay, rather than having a tool that tries to keep your, you know, example or your schema in sync with some other file that actually has values, what if we unify this so you have one file that contains both schema information and can set values declaratively or just have static values. And what if we make it sort of a unified toolkit to deal with sensitive things and nonsensitive things and we understand exactly which ones are sensitive. So uh that's kind of what Varlock is all about. So we it looks like a normal file but we use JS doc style decorator comments.

So you can say in a comment right above the item at required at sensitive at type equals email at type equals string starts with whatever abcore right so there's this &gt;&gt; very rich schema &gt;&gt; uh that you can express through just these comments that feels still familiar cuz it's like a file um and then aside from the schema sort of stuff that you that you use through comments we also have a function call syntax so that you can declaratively say go fetch this from one password like similar to the op inject or op run or whatever except for that it's totally general and you have a function so there's a plugin for one password op whatever there's a plugin for AWS for GCP for Azure for whatever and it's super easy to write new plugins so you have this sort of unified toolkit like fetch it from here validate it generate types single source of truth documentation everything all in one place &gt;&gt; the nice thing there is that you don't have to put all your eggs in one basket, right? So you can use one password for development or up to staging. You can use secrets manager in production. You can inject from Verscell in production.

Whatever you like. So you're not sort of like tied to one vendor for the actual persistence of those secrets. &gt;&gt; Okay. So I'm I'm looking at it right now.

It's a it's ava file that you I assume you commit to your repo, right? Like this is something that's that's allowed to go Yes. into your repo. And then you declare the types, which is really nice because like like half the time like I try to get somebody else spun up on a project.

You like, oh yeah, here's here's what I think you need in like thev file and then they're like they run it and they get an error process whatever not defined, right? And &gt;&gt; your example is out of date, all that type of stuff. So this really nice that you do that as well as as the actual types. Um, which is also nice like you can describe starts with dot like sk um because like somebody might call it a token, somebody else might call it an ID and you're like which one do I need?

&gt;&gt; Um, that's that's really cool. So, and then so everybody who's working your project then has thev.s schema file. Then does everybody in your team need to use the same way to expose those? It's like if somebody if one of them uses one password, do they need to use the one password as well?

&gt;&gt; It's up to you, right? So there's there's you could have it so that this only has the schema and does validation and then you're putting values in, you know, in av.local file that you're still whatever copy pasting doing whatever you want. You could in the schema declaratively say, hey, go fetch this from one password and wire up sort of, you know, each item to the right place. You can load a whole bunch of stuff from one password at once like an as whether it's an environment or a single item that's like aend blob.

You could load from you know a variety of other places or like in production you know often the first step of sort of implementing this is set this up the validation will run but you're still going to inject real environment variables from you know the Verscell secrets UI right for prod and you're still getting that extra validation and you know especially when it fails now instead of getting this weird runtime explosion. Oh yeah, &gt;&gt; it's like this thing blew up. When it goes to try to build or boot or whatever, it's going to say, "Hey, this environment variable is missing and it's marked as required or this thing doesn't, you know, it's it's typed in wrong." &gt;&gt; Yeah, I remember when I first saw this, I was worried about like production, but you're you're not modifying the ENV file. You're just you're still copying and pasting the ENV varss into Versel or whoever's dashboard the same way, but you are still getting all the features.

So that's that's that's really &gt;&gt; you could do either you could do it you could you could you know the first step would be here's a schema run validation leave that stuff being injected how it was before the second step is you know I want to actually centralize all this so I'm going to move everything to one password and then on production you would just set one single key which would be like a service account token which enables it to talk to one password and especially if you're in sort of a like multicloud &gt;&gt; you know micros service situation and you got a million things going on like centralizing everything into a sane way of dealing with it is going to be you know much much easier. &gt;&gt; Yeah, that makes a lot of sense. I it's funny because like when you first hear about like okay we're adding we're adding a schema to your envir uh and you know type safe comments and all this stuff. It all feels like maybe that's too much for envir you realize I've hit every single one of these use cases in which this would have made my life better.

every single one of them and like the buyin is like so insignificant that like why why isn't everybody using this? This is like it feels like uh this is like kind of a missing piece of technology, right? &gt;&gt; One of the best feelings is when you implement this and then you go and delete all of that code that's just checking node end. &gt;&gt; Oh yeah.

&gt;&gt; So you set up value in production or value in staging, all of that goes away, right? What Theo didn't mention it before is like you can have a hierarchical set of files based on the current environment too. So you could have a a dev schema, a staging schema, production schema. They could either be expressed in separate files or you using some of our sort of primitives in one file.

&gt;&gt; Yeah. And so you know you can you know there's also like there's an import syntax, right? So you can import from other places in a monor repo. That means, you know, you can have shared stuff at the root and each service can then import just the things they need from, you know, it's it's very very flexible.

&gt;&gt; Yeah. So, what does that buy in look like for the import? Is it really just swapping out your process imports or whatever with uh varlock imports? &gt;&gt; So, well, so what I'm talking about is importing from within a file, importing another file, right?

So there's a new root decorator at import you know do slash and that will import the the root.end right or you could import specific keys from it. In terms of implementing it in your code uh we have sort of drop in integrations for a bunch of different frameworks vit next uh you know astro all that and you you could continue to use process.n and because they are just injected as environment variables. But we also have sort of a nicer helper that gives you uh coerced values and better type completion. So like if you mark something as a boolean then when you actually go you know n dot whatever boolean thing it's going to be true or false.

It's not going to be one or zero or true and hey check if this thing is a string or you know all that extra coercion logic you end up shoving in five different places. All that just goes away. Is is there ever a standard like is anyone working on a standard for this type of thing? Because with with Cloudflare you you import ENV um from Cloudflare workers which I like better than just process.env but I don't like that because then then it makes my code like kind of pigeon holed into &gt;&gt; wait didn't node doesn't node do that as well you talk you're then experts.

&gt;&gt; So I mean you can use process.n end. Uh then there's also import.n for import.meta.end, right? And um I I think why all of this really gets confusing for people is because in a front-end context, there are no environment variables yet we use environment variables to inject things like statically in at build time. So like what even is an environment variable and how are they used really varies depending on what kind of framework you're working with, what kind of project you're working with.

Um, you know, we we really do try to simplify a lot of that. So, we have this import n from varlock helper and that does try to just make it work in all cases. So, that works in the front end and the back end and it does the replacements with vit and all that stuff. Um, &gt;&gt; one other cool thing like it does those replacements based on your schema.

So, you say hey this is sensitive or it's not. It's not based on some weird prefix, right? And the like it's a it's a lot more explicit uh in terms of what you what you want it to be doing. &gt;&gt; Yeah.

It's not just this this random thing that's available in the air like where where does process come from, you know? &gt;&gt; Yeah. Yeah. And if you want to see all of the errors in your application, you'll want to check out Sentry at centry.io/sax.

You don't want a production application out there that well, you have no visibility into in case something is blowing up and you might not even know it. So head on over to centry.io/sax. Again, we've been using this tool for a long time and it totally rules. All right.

&gt;&gt; What about other languages as well? Like this is not just a JavaScript thing, right? &gt;&gt; Yeah. I mean why, you know, one could argue, you know, why are you using even using AN file with these weird decorators to do this stuff, right?

like but we started there because it's what people are used to. So we're trying to meet people where they are and it feels very familiar uh and it it feels applicable in any kind of language right like we did have a first kind of version of this uh called Domino where the schema was written in Typescript and it worked really well and a lot of things were cool about that but it you know &gt;&gt; trying to convince some Rust developer to like use this TypeScript schema in their code like it's just not going to happen right whereas if you say hey look it's a N file with some extra little markup on it. I was like, "Oh, that actually makes sense." Um, so for for Varlock, we have a standalone binary build that you can use with any language. So you could still do varlock run.

It will load, validate, do all of that and then inject it into your code which could be any language. We do also though like part of what we do is generate types. So there's a root decorator at generate types and you can say language equals TypeScript and it will generate TypeScript types. So we don't generate types for other languages yet but that should also be possible.

So you can imagine like you know hey just generate my Go types for my config or generate you know Rust like what whatever right it's by separating it becomes a lot more applicable for for anything. &gt;&gt; Yeah the benefit of the JavaScript ecosystem today is the is the sort of deep integration. And so we do you know console log redaction of those sensitive values. We prevent you from leaking them in HTTP responses that kind of thing.

So you know we would need to do integrations in other languages to give you that level of integration. But that that's coming too. One of the reasons why I think people like the one p like one password directly hasn't caught on is that you have to change your your run commands to like run something first and then it injects it into the environment and then that &gt;&gt; then it runs like like it would like inject it and then run npm rundev and then you'll have that but then there's these weird issues where if it has like a subprocess the variables don't get pushed to it sometimes. Is yours like that as well?

like do I have to run varlock something and and npm rundev &gt;&gt; only if you're trying to like if you're injecting it into say a non-JavaScript language for the JavaScript languages uh or like for different frameworks like we have a vit integration we have a next integration so those kind of happen at the like you know vit config level and it just works um and same with node like or bun or whatever like we have an autoimp import command that reaches out to the CLI and loads and injects So in all those cases you're not you're not prefixing everything with varlock run. It would just be like and this is a real other problem like say you wanted to run some like database migration, right? And you need to feed in that database URL into the migration uh or into the migrate command, right? You could do varlock run whatever prisma migrate and it would inject that in correctly without having to do any you know weird stuff having an extra JSON file or whatever.

Right. &gt;&gt; Yeah. Cool. Um, also I'm curious your opinions here on like when something should be a like a constant versus go in an environmental variable.

Um, because like sometimes I go nuts and just put like every single URL ever into it. I'm like, well, that that might change. Um, but then like when I'm searching through my code, it's kind of tricky. Like at what point is something a constant and what time does something become an environmental variable?

I mean I I would say the purists would say when it's dependent on the environment. So if you know if that URL is going to change um it should be an environment variable. I don't know what do you what do you think there? &gt;&gt; I will say this because such a pain I think everyone avoids it right you avoid putting stuff in envirs because your your your.ample example gets so long and you copy paste it and it's like illegible, right?

Whereas &gt;&gt; now when you have this schema, the more work you put into it, the more comments you put in there and the more validation you put in there, the more valuable it gets and you're not trying to keep anything in sync anymore. So I've I've personally found as we start using it, I'm putting more and more stuff in there because I have this really nice tooling, nice like really nice type completion, really nice validation. And it's like if I think this thing might change or just kind of even feels configy, why not throw it in there? &gt;&gt; Throw it in there.

I agree. Like the not having it typed is a major reason why I often would be like maybe maybe throw this in like a constants.ts file. Um, and like recently, I don't know in the last couple years, all of my Cloudflare worker stuff, they do a really good job at typing your environmental variables. And they have this they have this new thing where it will just autogenerate for you and it's all beautifully typed and you just import env.

And like I'm like, "Oh, this is like a nice experience for environment." And it sounds like this is a lot like maybe even better, right? You can you can have everything fully typed. &gt;&gt; Yeah. And you get and it's self-documenting too.

So there's a we have a docs decorator where you can give it a URL. So you can literally like link out to documentation. So when you you know you hover over that variable, you get the nice IntelliSense with a description and a link to the docs. &gt;&gt; So it's it's a nice sort of onboarding tool for new developers or a debugging tool as well.

Yeah, like the IntelliSense is pretty awesome like and it's it's just not possible to get this from something like Zod, right? Zod is doing all this crazy magic TypeScript voodoo to extract like the the types from this big crazy schema. We just generate a normal TypeScript like file and each one of those the when you look at it like the comments are really long because we actually also have like a little SVG in there. So we use like a iconify you can attach an icon to everyone too.

So it's like you hover over the like whatever Google API key and there's like the little Google logo. Like it looks really slick. &gt;&gt; Uh and it's just it's to a level where you would never do it yourself but it just when you're actually using it it's it's beautiful. Yeah.

And you could picture a world where, you know, some of these are vendor provided and you don't you don't even have to write them by hand. Like we we'd like to get eventually get there, like have a big schema registry for off-the-shelf stuff. &gt;&gt; Yeah. Right.

That'd be cool. Yeah. I was wondering about that. I I love the the decorator syntax, honestly.

Uh because it's really readable. I was just seeing the one that was prevent leaks. What is that doing? That that's like it's seeing if your var is used in an HTTP request and then throwing an error.

That's &gt;&gt; so we do we do two things um with sensitive you know we know exactly which values are sensitive and we know the real value so we're not trying to do any like oh this thing looks like an API key so we better be careful with it like it's like no this is the API key and there's there's two things we do uh currently only in JavaScript but um we patch global console methods to automatically redact that value if it's written out in console log error &gt;&gt; and then we also do that if you do Var run like it's it's redacted and standard out and like sort of on the way. Um the other thing that we do is we patch global uh what is it server response and response objects so that if like say you have an express server or whatever any anything basically if you return one of those sensitive values in the outgoing HTTP response it will block you. So like especially say you're writing an MCP server, right, that needs access to a bunch of sensitive keys, &gt;&gt; it's probably not going to leak anything, but this is just an extra layer of protection where you know it is physically impossible for it to leak it. &gt;&gt; Um &gt;&gt; or in this sort of RSC world where it might be hard to reason about where a component is rendered in that tree on the client or the server and then you know you change one dependent in that tree and all of a sudden it's now res rendered on the client.

Uh, it'll prevent that. &gt;&gt; Oh, that's great. &gt;&gt; Yeah. I mean, it's it's just so easy to do the wrong thing and it's like, why do I have to know all the rules and how which things I should put a prefix on.

It's like, let's just make it so you can't shoot yourself in the foot. Make the easy way just &gt;&gt; easy to do the wrong thing, which is what I like. Yeah. What I like about this whole setup.

Anyway, &gt;&gt; you know what you guys should do? And I know that we shouldn't be putting them inv files. One thing that I I tweeted about many years ago is like I when I'm recording courses, you got to make sure you don't actually tab to the wrong file. Um we I saw a couple couple of weeks ago somebody was streaming and they're they they tabbed to the wrong uh tab and then their their key was on there and somebody racked up a $3,000 AI bill just in in like an hour or two, right?

Like it's so quick to do those things. And John Papa made a VS Code extension that is called Cloak &gt;&gt; which it basically just like blocks them out. So you can you can show your file but you can't actually look at them. Um but it stopped working.

Hasn't been updated in four or five years. You guys should like fix that Chrome extension and then just put a huge banner for Vlock on be like you shouldn't be doing this. Uh &gt;&gt; stop doing this. &gt;&gt; Yeah, stop doing this.

Use Varlock. &gt;&gt; Yeah. the the official one password VS Code extension I I believe does that with a little bit of &gt;&gt; setup. Uh yeah, &gt;&gt; there's a few more extensions I've seen pop up now lately.

Um &gt;&gt; yeah, I mean that the something I wanted to talk about was like because AI coding is so much easier now. The rate of like, hey, I built a tool that injects environment variables or validates environment variables or, you know, encrypts them and you can send them to your teammates. Like they're popping up literally every day there's a new one. It's insane.

And which clearly shows that people are not satisfied with the tooling as it is today. &gt;&gt; You know, I think a lot of them get it wrong where they're like, "Hey, I built a tool. It checks to make sure that your example file and your real environment is like still in sync." It's like, &gt;&gt; no, you still have the same problem. Actually use a schema, actually load it so it can never be out of sync.

Like just remove the problem. &gt;&gt; Let's talk about like just like AI agents in general, right? like you're using cloud code or open code or Gemini CLI any of these things. In some cases, it's nice for them to have environmental variables, right?

And and I haven't seen a really good way of how to like necessarily inject those things. What's your take on that? &gt;&gt; Yeah, I mean we I I think we have a pretty great solution for that. So like you can do it with Varlock Run uh and just load the ones you need and pass those in.

I think Theo has a quick demo if you want to see it, but uh we we don't have to do that now. Um &gt;&gt; yeah. No, I I I would like to see like what that process is like. &gt;&gt; And I can I can talk a bit about that while he's setting that up.

Like I think the difference there, especially with Claude, is like those secrets might not necessarily live in a repo, right? Those might be sort of like outside the repo because you want to, you know, for example, the way we use it, we need to pass in the sort of like Amazon bedrock config. So we can use that for our claude instead of the default thing. So that doesn't necessarily live in the repo.

It lives in the invocation of claude, right? So you can yeah, &gt;&gt; you can stick that in your home folder and just pass that in when you when you load the com when you load claude. &gt;&gt; Yeah. So I mean there's there's a a bunch of different parts of this problem, right?

But this is one specific part which is like I actually just need some keys to run the AI agent itself. Not like that the AI agent will need. Um but I've got this enenv.cloud file that lives in my home folder right and it's using a a plugin to say hey I'm you know I want to be able to talk to one password. Uh I initialize it with some settings.

I have my function that's going to fetch that from one password. you know I mark it as sensitive some other configuration right and then in my sort of you know setup I have an alias for vcloud which calls varlock run points at the end.cloud claude file that's in my home folder and then runs claude. So like that is obviously it's only part of the problem but this lets me have you know a centralized place outside of the context of one repo to fetch these environment variables feed them to cloud itself which like I think is just super handy right as soon as as soon as I had it set up I've been using it all the time and it's awesome &gt;&gt; and those variables could be you know off keys for MCP servers or anything you know &gt;&gt; downstream of cloud itself. Yeah, I mean obviously then there's then there's like the next part of the problem which is like how do you uh you know how do you limit sort of the agent from having access to things and you know there's there's some different things there like you could use a proxy at the very least you can limit what environment variables are passed to it in the first place that's something that you can do with us Ben uh at modem is just using it for bodbot which is sort of like his open claw you know teammate kind thing.

Very cool. &gt;&gt; Are we talking about Ben Vinegar? &gt;&gt; We are &gt;&gt; a former syntax uh uh team manager. Ben Vinegar.

&gt;&gt; Yeah, shout out to Ben. &gt;&gt; So, he just he just started using um this for to run Bodbot, right? And he's got all these different keys that his that the bot needs, right? So, at least having that schema there, it's very clear what's there.

What are the types, you know, explode if they're not if they're not correct. &gt;&gt; Yeah. So, I think there's there's two sides to this, right? There's the security guardrails we already talked about to prevent the secrets from being leaked to the agents.

So, you know, getting them out of plain text and then preventing leaks in those HTTP responses in your your console log statements, etc. And then I think one of the big benefits is this schema- driven approach. So the the agents themselves are pretty adept at writing it because it's you know a known DSL that they can reason about and they have a CLI method they can call to validate the output. So you know schema in validation out they they you can write a pretty short claude skill and it it usually does a good job.

&gt;&gt; That's great. &gt;&gt; Yeah. Yeah. And speaking of like AI stuff, um I noticed you all have both an MCP and a LLM.txt which is just like you know the docs in a text format.

But what's the MCP doing for you all? &gt;&gt; It's just uh doc search. So it's it's just uh I believe it's &gt;&gt; using the Cloudflare AI gateway and then auto rag uh pointed at the doc site itself. Um, so just an easier way, you know, I I think if you just like point it at that server and tell it to install VLOOKU and do the onboarding, it'll do a pretty good job.

But I probably need to retest that because it's been a few weeks. &gt;&gt; Sure. Yeah. &gt;&gt; Few weeks is a lifetime here.

&gt;&gt; I know. Yeah. I appreciate you all having open code config in your copy and paste uh config for the MCP. So many people don't put that in there.

I don't know why. I think Open Code's getting a little bit more ubiquitous, but still uh &gt;&gt; great for that. &gt;&gt; Great Toronto startup. &gt;&gt; We we both spoke at one of Ben Vinegar's events a few months ago.

&gt;&gt; Ben Ben is the man. Uh uh for sure. I actually I have a quick question here. You have a GitHub uh GitHub actions integration.

I hate working with ENVARS in GitHub actions. What does this do for me there? Yeah. So it's it's a pretty thin wrapper on the CLI, but it allows you to do, you know, just a quick validation in CI.

Uh so you know that would be the equivalent of running I think it actually is just running varock load. So that that way you can validate your end as a first step before you do the rest of your workflow. Oh, I hate when my action fails because the env is wrong or missing or something and I don't find out till like the third step and I have to sit and wait and like for me that like feedback loop of like it takes so long &gt;&gt; that I just like lose my mind with that stuff. &gt;&gt; Yeah.

And then you get you get a nice pretty printed redacted output, right? So you can see what key was missing or which one failed validation. And if in the case where you're using, you know, GitHub secrets, you can just go in and paste in the key you forgot or whatever. &gt;&gt; Sick.

&gt;&gt; That sort of output in CI to show you what is the current state of all your environment. I have found extremely useful. Um, you know, just it's such a nice debugging tool to be able to go and see what what was actually going on here cuz, you know, in the past you'd just the amount of back and forth you'd have to do to start, you know, logging things and like then take it out of the code is just such a pain. Um, and just I did want to clarify one thing about the GitHub action.

Um, is that like if you're using a sort of, you know, say you have like a whatever spelt app or next app or some JavaScripty thing like you probably don't actually need to use that action. It's already built into your code and you know how it's loading and everything. So like that action would be just for if you weren't really using varlock like deeply tied into your code else like other in your code &gt;&gt; you're saying if you were using like the Varlock plugin not not just if you were using a spelt kit app off the shelf &gt;&gt; or like if if you have varock built into your codebase already um then you wouldn't need the action like you you'd already have it installed you could just you know you could invoke it self you can it's already going to fail if your build fails at the beginning. So it's &gt;&gt; yeah but it's nice if you say if you have like a multi-step workflow and you need to you know thread an environment variable through later steps it gives you an easy way to reuse them output them.

&gt;&gt; I'm curious what your opinions on like secrets managers are and like like should we be using them? I know some people have like services that they use and like you've got a thousand developers and you can manage access to them. Probably for smaller folks just throwing them in one password is probably good, but like what do you think about like signing up for something and having a place where you can put all of your secrets? &gt;&gt; We're big fans of one password.

Um, you know, I think that even for a lot of people that are using something else on top of it, the secret still probably lives in one password as the source of truth. So it's like why not just use it as the source of truth instead of copy pasting it. Um you know vault is a nightmare um in physical is a bit better. All the cloud providers have their own things.

Doppler seem like &gt;&gt; they're all fine but they're all they're all enterprise tools that would only make sense if you are like an enterprise and willing to pay all this money. And so like we wanted to build a tool that would make sense to use even when you're a solo dev and you're doing everything yourself and then scales up to a giant team and you know having a lot of complex stuff going on. &gt;&gt; Yeah man. And and this is not anything to do with Varlock, but I'm just curious if you have any thoughts on it is I every time I spin up a demo, I need to go grab an API key from somewhere, you know, and you you log in to got to remember what the Open AI play like playground URL is or like you have to do like slay the dragons that is the Google &gt;&gt; uh developer console.

Oh my god, finding it. They're they're just all so awful. And and I'm reminded of like some of these tools for AWS to set them up you have to like set up a an AM rule that allows to you to do anything and then then the tool itself will act on your behalf. I'm curious if you've ever thought about something that will allow you to generate API keys from multiple services as you need it because I always want like an API key from whatever and put like a $10 limit on it, you know, and just fussing around.

I don't I'm not reusing API keys across projects cuz &gt;&gt; if that gets out, then I'll I'll have no idea &gt;&gt; which one how that leaked, right? &gt;&gt; Yeah. &gt;&gt; Yeah. I mean the the the holy grail of all this is like automated secret rotation and dynamic keys right so you have a master key right that only lives in say say that lives in like we'll talk through the CI uh case right so let's say you have a master key that lives in GitHub but as part of the like deployment CI run it's going to issue a new key that has you know less privileges and is only going to be around for a little while um and it is something that we're working on like uh it's just it's tricky.

&gt;&gt; It's really tricky. &gt;&gt; And like I'm sure a lot of like these companies don't want you giving out API keys as well, you know, like is there an API for API keys to every business? &gt;&gt; No. Uh Open AI actually has one.

&gt;&gt; Oh, really? &gt;&gt; Yeah. Which is it's slightly terrifying because if you have a master key, I believe you can just mint new master keys. &gt;&gt; Just a whole bunch.

So, don't leak those master keys, folks. &gt;&gt; Yeah. &gt;&gt; Oh, &gt;&gt; man. &gt;&gt; Oh, man.

So, okay. So, this is this project is is is just like it's free to install and use, right? Like what what's the what's the like &gt;&gt; how do you guys make money? &gt;&gt; Yeah.

How how's this thing going to stay afloat? Is this sponsored or what's the deal? &gt;&gt; Yeah. I mean, we we've got investors.

Um we've we've got Runway. Uh, I I do think anything like this that you're trusting to put in your repo, you're trusting with your secrets, it has to be open source. It has to be I mean most of it has to be free. Like I don't know about you, but I I don't think I' I'd be putting like a blackbox binary on my computer and trusting it with my secrets.

Although maybe maybe that's not the case anymore. &gt;&gt; We npm install those every single day. Thank you very much. &gt;&gt; And then it installs five more and then takes your crypto wallets.

Yeah. &gt;&gt; Yeah. I mean longterm obviously like there's a secret management play here. Um today we're kind of you know that platform platform agnostic control plane that sits in front of all of them but you know there's obviously a future where we have our own offering there as well.

We're exploring some sort of more enterprisey workflows right now around dynamic secrets secret rotation that kind of thing which you know there's a pretty hefty cost to running the compute. So it certainly will not be free. &gt;&gt; Yeah. So there's no like there's no rug pull coming with the library, right?

You just library. &gt;&gt; Absolutely. Day one we we both agreed there will never be a rug pull. Especially seeing you know a company like Hashior Corp lose so much good favor with the community after after doing that or you know Reddus, etc.

all these licensing changes that never really make anyone happy except the people who make money from it. &gt;&gt; Yeah. But you can easily imagine our own hosted secret, you know, sort of backend, right? Uh you can imagine uh some additional features around like logs um and policy, right?

Like so ensure that none of my developers have any plain tech secrets on their machine, right? like you can imagine sort of some of those enterprisey features the the automated rotation dynamic secrets. Um but you know we we we always were like let's let's start with just making the tool useful for everyone. &gt;&gt; Yeah.

&gt;&gt; Uh rather than like here's a you know secure place to put your secrets. Now have fun wiring it into your code like we start on the other end. &gt;&gt; That's awesome. Well I definitely want to give a shout out.

We we recently participated in the GitHub secure open source fund uh with a bunch of the like most popular open source projects in the world. Uh it was really great to be, you know, one of the smaller participants. Uh so shout out to them. We just announced that last week.

&gt;&gt; Hell yeah. &gt;&gt; Yeah. &gt;&gt; Uh yeah, that rolls. You know, I think for a lot of people like if you're using one password already, like so many people we talk to are using one password, but they don't really think about using it for their developer secrets, right?

Um &gt;&gt; I would say they do have some offerings in the sort of developer workflow stuff. Our tool obviously makes it easier and adds a whole lot more on top. Um so if you do use one password, give it a shot. Try it out.

Um, I love, you know, scanning my finger to unlock the secrets. It just feels good. I don't know how safe it really is, but it it feels much safer. Um, and the fact that it all is a single source of truth that like I can update it in one place.

I can think about it. It's all, you know, together is just super nice. And and you know, that is one of the benefits that one password has like versus something like AWS or these other tools. Like you always need a secret zero, right?

which is like what lets me connect to this back end with one password because you're also using it for other stuff. You already have the secret zero. It's already set up. It's on your machine.

Whereas for anything else, you're going to need, you know, an API key, machine token, whatever, which you then need to store somewhere on your machine, and you run back into the same problems of like, where do I put this? How do I keep it secure? &gt;&gt; Totally. All right.

Last section we have here is sick pics and shameless plugs. Did you guys come prepared with either of those? &gt;&gt; Yeah, I can I can start if you want. My &gt;&gt; my sick pick is uh Bella.io BA.

&gt;&gt; They make these awesome little uh I don't know audio modules. So, this is a Bella Gem Multi. It's a 10-in 10out audio interface &gt;&gt; and it has like a web IDE. You just plug it into your computer with a USBC cable and you've got an IDE for it.

I can see Scott's eyes lighting up. I can see the &gt;&gt; Scott's already one for sure. &gt;&gt; So, you can like make you can make custom instruments with it. It's super cool.

Uh you can run true data patches. &gt;&gt; Yeah. &gt;&gt; Programmable Eurorack module, dude. &gt;&gt; Yeah, they have open source Euroack modules, too.

Yeah. I mean, &gt;&gt; what I don't even know what this is. It's so &gt;&gt; it's like uh it's a sound card with a computer bolted to it and an open platform that lets you write code. So, you know, you could make a synthesizer with it.

Uh you could like big artists use it for installations cuz you can process, you know, sensors and stuff through it. Um that's why I got it. &gt;&gt; Cool. &gt;&gt; Oh, so inputs to this are what?

There's 10 audio inputs and 10 audio outputs. And then there's analog inputs, you know, so like voltage and then digital voltage, you know, like like you would have on the GPIO pins of a Raspberry Pi or something. &gt;&gt; Ooh, that's cool. &gt;&gt; Yeah, &gt;&gt; this seems very hackable and very cool.

&gt;&gt; A lot of cool stuff on here. &gt;&gt; Yeah, I mean their Euroack modules are super fun, too. That Bella gly, it's just a little touch strip. &gt;&gt; Yeah.

I've got the best idea for your business for Varock. Instead of touching your finger, you have to play Stairway to Heaven to unlock your environmental variables. &gt;&gt; Yeah. Well, there's no stairway allowed here.

Sorry. &gt;&gt; There's no stairway. &gt;&gt; Yeah. Oh my god.

Oh, we we we did that for our capture challenge. I made Wes sing uh certain pitches. It would say like sing a D flat or something. A Dar.

&gt;&gt; And like the hilarious part is I didn't know what a a D or a E was. Like I know I don't know. I enjoyer of music, but not I don't know anything about making music. So I had to Scott had to coach me through how to sing an e.

&gt;&gt; Awesome. &gt;&gt; Uh and yeah, shameless plug. Uh I make music, too. So if you go to nautical artifacts.bandamp.com, uh all my all my stuff's up there.

There's a new remix album probably coming in the next month or two. &gt;&gt; Cool. Love the art. &gt;&gt; Sick.

Canadian as well. He's I didn't didn't say this as well, but yeah, Phil's from Hamilton, which is awesome. Um, I'm from Hamilton. Best city in the world.

So, &gt;&gt; I'm almost from Hamilton. Uh, Theo, what do you got? &gt;&gt; Yeah. Um, uh, sick picks.

Let's see. I I've really been enjoying a new show lately that I had not heard about at all. It's called Wonderman on Disney and it is a Marvel universe show with very little superheroy stuff in it and it is it's really really excellent. I'm loving it.

&gt;&gt; Yeah, I haven't heard of it. &gt;&gt; So &gt;&gt; yeah. Um and shameless plug um I've been building a little side project with, you know, with my new AI superpowers as we all probably are. Uh the website is how to store.food.

Uh, and it is a sort of comprehensive uh &gt;&gt; comprehensive guide for, you know, kiwis. Do they go in the fridge or not? You know, how do can you freeze them? Can you dehydrate them?

&gt;&gt; Just everything you could possibly think of. Um, and &gt;&gt; I've used like a ton of really really cool like CSS um, page transitions. It's really beautiful. Um, it's not it's not quite done yet, so I'm I'm hoping it'll be ready by the time this goes out, but uh yeah, please check it out.

&gt;&gt; Yeah. &gt;&gt; All right. Can you settle a bet for us since you're a food storage expert? &gt;&gt; I could try.

&gt;&gt; Soy sauce. Is that a fridge or or cupboard? &gt;&gt; You know, I keep &gt;&gt; not what it says on the bottle, but &gt;&gt; No, let's hear what he has to say. &gt;&gt; I keep mine in the fridge.

Uh, but I tend to re I tend to look at the bottle and see what it says and and try to follow it. &gt;&gt; Yes, the man has gotten to you. Okay. &gt;&gt; No, that's f it's perfectly the fine way to to live your life is to look at the bottle and put in the fridge if it says to.

That's perfectly fine. &gt;&gt; But but that would definitely be one that would be one where if somebody had it not in the fridge, I wouldn't be like, "Oh god, it's gone off." Like I'd be like, "No, it's fine. Whatever." &gt;&gt; I I've heard of people who don't keep ketchup in the fridge. &gt;&gt; M not me.

Oh, that was me. We grew up as a a child, we grew up with a ketchup and then you'd get this like you'd get the like ketchup sauce on the top because it would separate and you have to shake it. But I was fine. But we we were in the fridge now.

So, it's actually interesting that I changed that, but certainly not soy sauce. There's people that don't put mayonnaise in the in the fridge. &gt;&gt; Oh, mayo. Mayo goes in the fridge for sure.

&gt;&gt; Mayo goes in the fridge. What? How do you all feel about butter? butter out of the fridge for sure.

We put it on we put it on top of the uh in the cupboard on top of the light so it's always a little bit melty. &gt;&gt; Yeah, &gt;&gt; I prefer it out of the fridge, but we keep it in the fridge. &gt;&gt; A lot of people keep it in the fridge, but I'm telling you, if you're one of those people, try it out of the fridge and then when you go to spread it on something, you'll be like, "What have I been doing with my life?" &gt;&gt; Yeah. &gt;&gt; I don't know how people could do it.

Like half the year our butter is too hard when it's out of the fridge. &gt;&gt; It's not an easy spread, I'll tell you. hardware. &gt;&gt; Oh man.

Awesome. Well, thank you guys so much for coming on. Check it out. varlock.dev and uh get I'm going to get my uh I'm going to get my house in order and write &gt;&gt; my house in order right now.

Please give us a star. &gt;&gt; Environment. &gt;&gt; Um as an open source developer, uh we we need those stars. So if you do check it out, please give us a star on GitHub.

&gt;&gt; I just started 9:14. If you're listening to this right now, if you are one number 1,000, you will win a free environmental variable. &gt;&gt; I'll give you a sweet t-shirt if you're number one. &gt;&gt; Yeah, we'll give you a sweet shirt and some stickers.

Yeah, we still have to make them, but that now now I have to make them. &gt;&gt; And you guys got great branding, so the shirt is going to be sick. So, &gt;&gt; all right. Peace.

Thanks so much.
