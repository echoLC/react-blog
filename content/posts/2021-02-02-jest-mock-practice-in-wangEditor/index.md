---
title: Typescript中的条件类型
slug: jest-mock-practice-inn-wangEditor
cover: ./cover4.png
generate-card: false
date: 2021-02-02
language: zh_cn
tags: ['Jest', 'wangEditor']
---

## 前言
[wangEditor](https://github.com/wangeditor-team/wangEditor)是一个优秀的国产富文本编辑器，因为其 `API` 设计简单易用深受国内很多用户的喜爱，目前，我们有3个人数过千的用户QQ群，`github star`数已经达到了**11k**，在 `NPM` 上的周下载量在**10k**左右，在国产开源项目里面，特别是富文本编辑器领域内，已经算是很不错的成绩了。

2020我们升级了 `V4` 版本，使用 `Typescript` 重写，这次我们是以组建开源团队的形式，大家分工对编辑器各模块进行开发。我是在2020年10月份加入 `wangEditor` 开发团队的，那时候核心功能基本已经开发完毕了。加入团队后，我主要负责项目的测试，包括单元测试（后面简称单测）和 `E2E` 测试，通过提高单测的覆盖率和质量保证项目代码的质量。

`V4`升级以来，我们落下了很多单测，这一块说句实话我们做的不怎么好。我刚加入团队的时候，单测覆盖率最高在 **65%** 左右，后面一度出现下降的趋势，最低的时候到 **62%** 左右。说实话，作为一个优秀的开源项目，这个数字的单测覆盖率肯定是不及格的，但是话又说回来，富文本场景因为其 API 特殊性，还有就是依赖交互的功能，给单元测试的实施带来了巨大的挑战。

## 富文本编辑器单元测试难在哪
**其一**，稍微看过我们编辑器源码的小伙伴应该知道，我们的核心模块：`Editor`、`Text`、`History`、`Selection`、`Menu` 等，它们的设计都是类的方式，而且作为 `Editor` 的依赖，频繁跟编辑器进行交互来驱动编辑器的功能。我们知道，在单元测试中，最复杂的测试场景之一就是对象之间的交互。我们的整个设计就已经注定了我们的单测不会容易，当然这样的设计对于复用和模块之间的划分还是很有帮助的。

**其二**，编辑器的经典产品呈现模式，就是工具栏和编辑区域两块。编辑区域使用 `contenteditable` 使得容器有了编辑的能力，菜单和编辑区域通过用户操作来进行配合，进行加粗、对齐样式、标题样式、代码块、引用、插入图片等功能交互。这就使得，编辑器的很多功能测试要依赖用户的交互，比如点击、鼠标移出和移入、键盘、滚动、复制和粘贴等事件。

**其三**，在 `Jest` 中很多原生的浏览器 API 都是不支持的，例如我们编辑器核心的 API：`document.execCommand`，还有 `Clipboard Event`等。而其它的一些核心对象 `Selection` 就算支持，也很难在 `Jest` 中模拟用户的操作去进行选区操作，这都给单元测试带来了困难。

除此之外，还有上传图片功能涉及到 `Ajax`、`File` 等对象，我们知道单测是不能有真实依赖物的，你不能让图片上传这样的功能测试依赖真实的 API 服务。如果使用了真实依赖物，那么你做的就不是单元测试了，而是集成测试。

## wangEditor是怎么解决上述这些问题的
我刚接受项目的单元测试的时候，我也一度比较愁，于是我重新撸了一遍 `Jest` 的官网文档，买了学习单测的书籍，进行知识储备。无论是对象交互，还是依赖用户交互的功能，亦或是 `Ajax` 测试，没有什么是伪对象（Fake Object）解决不了的，对于我们在测试中不能控制的对象，使用伪对象替换就行了。

这里先普及一点单元测试中比较重要的知识，**伪对象技术（Fake Object）**。 在单测中最常用的有两类伪对象，一类叫模拟对象（mock object），一类叫存根对象（stub object）。在做对象交互测试的时候，我们就需要经常使用这两种对象。那么它们之间有什么区别了？

**模拟对象**是测试系统中的伪对象，它可以验证被测试对象是否按照我们预期的方式进行调用，从而对单元测试的结果产生影响，所以通常我们在测试中会对模拟对象进行断言。下面讲到具体的例子时，我会再具体介绍。

**存根对象** 也是伪对象的一种，但是存根对象只是在测试中起着“站桩”的作用，协助我们测试，最后我们并不会对 `stub` 对象进行断言。

下面的图，可以加深我们的理解：

![](https://p6-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/f2815b3238f44603b3ec1fbb948d6b72~tplv-k3u1fbpfcp-watermark.image)
![](https://p1-juejin.byteimg.com/tos-cn-i-k3u1fbpfcp/b12eb2604487442ab8df696333b87689~tplv-k3u1fbpfcp-watermark.image)

在 `wangEditor` 中，我们大量使用了这两种技术来协助单元测试。

## Jest中的模拟技术
我们使用的测试框架是 `Jest` ，为了后续的介绍做铺垫，这里先稍微普及一点 `Jest` 中的模拟技术。在 `Jest` 中是没有区分模拟对象和存根对象的，也没有 API 来区分 `mock` 或者 `stub`，怎么区分两种对象还是看你怎么在测试中使用 `Jest` API所创建的对象。 

### 模拟函数
在 `Jest` 中模拟函数非常简单，下面看几个例子：
```js
const fn = jest.fn()
const fn1 = jest.fn().mockImplementation(() => 'fn1')
const fn2 = jest.fn().mockReturnValue(true)
```
上面这几种方式都是常见的模拟函数的方式。

### 模拟ES6 class
除了模拟函数外，`Jest` 也可以模拟 `ES6` 中的类：
```js
import SoundPlayer from './sound-player';
import SoundPlayerConsumer from './sound-player-consumer';
jest.mock('./sound-player'); 

it('We can check if the consumer called the class constructor', () => {
  const soundPlayerConsumer = new SoundPlayerConsumer();
  expect(SoundPlayer).toHaveBeenCalledTimes(1);
});
```
当然你也可以模拟类具体的方法：
```js
import SoundPlayer from './sound-player';
const mockPlaySoundFile = jest.fn();
jest.mock('./sound-player', () => {
  return jest.fn().mockImplementation(() => {
    return {playSoundFile: mockPlaySoundFile};
  });
});
```
这是 `Jest` 官网的几个例子，这里我就不具体介绍了，大家感兴趣可以去 [Jest](https://jestjs.io/docs/en/es6-class-mocks) 官网了解更多 。

### 模拟某个对象的某个方法
在 `Jest` 有一个很好用的 API：[jest.spyOn](https://jestjs.io/docs/en/jest-object#jestspyonobject-methodname)，这是我在项目中经常用的，下面看我们项目中的一个例子：
```ts
const liParent = $('<ul></ul>')
const li = $('<li></li>')
liParent.append(li)

jest.spyOn(editor.selection, 'getSelectionContainerElem').mockReturnValue(li)
```

## wangEditor中的模拟技术使用
前面介绍到在 `wangEditor` 中有大量的测试场景都涉及到对象交互，所以创建各种模拟对象或者存根对象必不可少。下面，我们一个个介绍。

### 模拟dcoument.execCommand
前面我们提到，在 `Jest` 中，并不支持原生的 `document.execCommand API`，但是我们又有大量的测试场景需要依赖该 `API`，所以我们模拟了该函数：
```ts
export default function mockCommand (document: Document) {
    document.execCommand = jest.fn()
    document.queryCommandValue = jest.fn()
    document.queryCommandState = jest.fn()
    document.queryCommandSupported = jest.fn().mockReturnValue(true)
}
```
在测试中使用：
```ts
import mockCommand from '../../helpers/command-mock'

test('调用 createAction 能创建指定行和列的表格', () => {

    mockCommand(document)
    
    const editor = createEditor(document, `div1`)
    const createTableInstance = new CreateTable(editor)
    createTableInstance.createAction(2, 1)
    
    expect(document.execCommand).toBeCalledWith(
    	'insertHTML', 
     false, `<table border="0" width="100%" cellpadding="0" cellspacing="0"><tbody><tr><th></th></tr><tr>			<td></td></tr></tbody></table><p><br></p>`
        )
})
```
### 模拟XHR
在测试图片上传模块的时候，我们需要依赖 `Ajax`，但是我们没有使用真实的 `API` 服务，所以我们只能通过模拟的方式，去手动调用`Ajax` 的方法，我首先封装了一个 `xhrMockClass`：
```typescript
const xhrMockClass = (config: any) => ({
    open: jest.fn(),
    send: jest.fn(),
    setRequestHeader: jest.fn(),
    ontimeout: jest.fn(),
    upload: jest.fn(),
    onreadystatechange: jest.fn(),
    status: config.status,
    readyState: 4,
    responseText: config.res,
})

export default xhrMockClass
```
通过一些参数，控制 `Ajax` 的返回，从而模拟各种场景，以达到测试的目的，看在测试中的具体使用：
```ts
test('调用 uploadImg 上传图片失败，支持配置 onError 钩子监听', done => {
        expect.assertions(1)

        const errorFn = jest.fn()
        const alertFn = jest.fn()

        const upload = createUploadImgInstance({
            uploadImgServer,
            uploadImgHooks: {
                error: errorFn,
            },
            customAlert: alertFn,
        })
        const files = createMockFiles()

        const mockXHRObject = mockXHRHttpRequest({ status: 500 })

        upload.uploadImg(files)

        mockXHRObject.onreadystatechange()

        setTimeout(() => {
            expect(errorFn).toBeCalled()
            done()
        })
    })
```
有些小伙伴可能有疑问，在 `setTimeout` 断言之前的 `onreadystatechange` 调用，这不是人为去执行模拟的 `Ajax` 方法吗？这样有什么意义。首先，你要明白的是在上面的测试的场景中，你更关心的是当 `Ajax` 返回错误的时候，你定义的错误处理钩子有没有正确执行。你并不需要关心 `Ajax` 是怎么发生的，管它是我们手动模拟让它发生的，还是真实的 `API` 服务返回的，这并不影响我们的测试。

在该测试中，我们还模拟了两个函数，一个是我们关注的 `onError` 钩子，一个是 `alert`。因为错误发生时，我们的代码处理是既执行 `onError` 钩子，还会 `alert` 错误信息。而如果不传这个 `alert`，默认调用的是原生的 `window.alert`，在 `Jest` 中也是不支持该 API 的，这样测试就会报错而失败。回顾刚开始介绍的模拟对象和存根对象的区别，在这里我们断言的是错误回调的钩子有没有被执行，所以`alertFn` 在这里就是存根对象，而 `errorFn` 才是我们测试关注的模拟对象。

### 模拟用户交互
前面我们介绍了，富文本还有一块比较难测的是依赖用户交互的场景很多。有些菜单的设计暴露了 `clickHandler` 的公开 `API`，所以你可以直接调用 `clickHandler` 进行测试。但是有些场景，我们没法直接调用到 `click` 回调，就没法测试到回调中的代码。对于 `click` 交互，其实只要我们通过 `dom` 操作找到对应的元素，然后调用其 `click` 方法，就可以触发对应的回调了。然而，还有些场景，比如我们的下拉，是需要 `mouseEnter` 事件触发的，对于这种场景，就算我们定位到元素，也没对应的方法可以触发该事件。

经过调研，发现 `dom` 元素有一个原生的 `dispatchEvent` 方法，可以主动触发大部分的鼠标、键盘事件。于是，我封装了 `dispatchEvent` 方法，专门用来模拟用户的一些交互事件：
```ts
import { DomElement } from '../../src/utils/dom-core'

const EventType = {
    Event: Event,
    KeyBoardEvent: KeyboardEvent,
    MouseEvent: MouseEvent,
    // jest 没有ClipboardEvent，使用Event替代
    ClipboardEvent: Event,
}

type EventTypeKey = keyof typeof EventType

export default function mockEventTrigger(
    $el: DomElement,
    type: string,
    eventType: EventTypeKey = 'Event',
    option?: any
) {
    const EventConstruct = EventType[eventType]

    const event = new EventConstruct(type, {
        view: window,
        bubbles: true,
        cancelable: true,
        ...option,
    })
    $el.elems[0].dispatchEvent(event)
}
```
在测试中应用 `dispatchEvent`：
```ts
test('编辑器初始化后，编辑器区域会绑定 enter键 keyup 事件，触发执行eventsHook enterUpEvents的函数执行', () => {
        const mockClickFn = jest.fn()

        Object.defineProperty(editor.txt.eventHooks, 'enterUpEvents', {
            value: [mockClickFn, mockClickFn],
        })

        dispatchEvent(editor.$textElem, 'keyup', 'KeyBoardEvent', {
            keyCode: 13,
        })

        // 模拟不是enter键的情况
        dispatchEvent(editor.$textElem, 'keyup', 'KeyBoardEvent', {
            keyCode: 0,
        })

        expect(mockClickFn.mock.calls.length).toEqual(2)
    })
```
在上面的例子中，我们先劫持了事件钩子里的 `enterUpEvents` 的值，使用 `Jest` 模拟函数来替代。然后分别触发 `enter` 键 `KeyBoardEvent` 事件和其它非 `Enter` 键的事件，最后断言模拟函数执行了两次，而不是四次。

使用封装的 `dispatchEvent` 使得单测覆盖了几乎所有的鼠标和键盘事件场景，小伙伴们再也不用担心依赖用户交互的场景该怎么写单测。当然，目前还有一些事件没法模拟，不知道是否是我没有找到正确的方式，例如滚动事件，我试了很多方式，都没有能模拟成功。

### 其它
除了上述提到的，我们在测试中还模拟了一些其它的对象，比如模拟文件、模拟不同浏览器等，限于篇幅，在这里我就不一一介绍，感兴趣的小伙伴可以直接去我们仓库 `test` 目录下详细查看：[wangEditor](https://github.com/wangeditor-team/wangEditor/tree/master/test)。

在这里还要补充的是，我们项目中大量使用的两个 `API` 去模拟对象中的方法或者对象的值，它们分别是 `jest.spyOn` 和 `Object.defineProperty`。对于 `jest.spyOn`，我经常用来做一些存根对象（大多是对象方法）的模拟。刚开始我就提到了，`wangEditor` 很多功能依赖选区，然后对选区进行操作，或者获取选区里面的元素进行操作。但是，我们很难在 `Jest` 中去真正的依赖选区进行测试，所以这时候就需要使用存根对象进行替换。我们封装的 `selection` 对象是对选区操作和读取的集合，而它做为 `Editor`的一个依赖项，大多数情况下我们只需要去替换它的具体方法实现就可以让我们轻松进行测试。下面看一个例子：
```ts
test('编辑器初始化后，编辑器区域会绑定 mouseup mousedown 事件，对range进行处理，如果range不存在，不处理', () => {
    const saveRangeFn = jest.fn()
    const getRangeFn = jest.fn(() => null)
    jest.spyOn(editor.selection, 'saveRange').mockImplementation(saveRangeFn)
    jest.spyOn(editor.selection, 'getRange').mockImplementation(getRangeFn)

    dispatchEvent(editor.$textElem, 'mousedown', 'MouseEvent')
    dispatchEvent(editor.$textElem, 'mouseup', 'MouseEvent')

    expect(saveRangeFn).not.toBeCalled()
})
```
在上面的例子，我们测试的是当点击编辑区会保存当前 `range` 的情况，如果当前的 `range` 对象为 `null`，则不执行 `saveRange` 方法。我们通过 `spyOn` 分别创建了模拟函数 `saveRangeFn` 和 存根函数 `getRangeFn`，使得测试变得简单。当然除了用在选区对象 `selection` 对象，在其它一些类似的场景我也经常通过该 `API` 进行对象方法的模拟，给我的体验就是非常简单好用。

`spyOn` 一般是用来劫持对象的方法，当然，在 `Jest 22.1.0` 以后，你也可以用方法劫持对象属性的 `getter`，但是这个 `getter`必须是你自己在该对象上自定义的，而对象默认的 `getter` 你是不能劫持的，简单来说，它还是不适合用来模拟对象的属性。所以在模拟对象属性的时候，我一般使用 `Object.defineProperty`。这个 `API` 相信大家都不陌生，只要对 `Vue2.0` 响应式原理有过了解的话。它一般用来劫持对象的属性的 `getter` 和 `setter`，在一些测试场景下，我经常会用到。下面看一个例子：
```js
const imgUrl = 'http://www.wangeditor.com/imgs/logo.jpeg'
const errorUrl = 'error.jpeg'

 Object.defineProperty(global.Image.prototype, 'src', {
        // Define the property setter
        set(src) {
            if (src === errorUrl) {
                // Call with setTimeout to simulate async loading
                setTimeout(() => this.onerror(new Error('mocked error')))
            } else if (src === imgUrl) {
                setTimeout(() => this.onload())
            }
        },
    })
 
 test('调用 insertImg 可以网编辑器里插入图片，插入图片加载失败可以通过customAlert配置错误提示', done => {
        expect.assertions(1)

        const alertFn = jest.fn()

        const uploadImg = createUploadImgInstance({ customAlert: alertFn })

        mockSupportCommand()

        uploadImg.insertImg(errorUrl)

        setTimeout(() => {
            expect(alertFn).toBeCalledWith(
                '插入图片错误',
                'error',
                `wangEditor: 插入图片错误，图片链接 "${errorUrl}"，下载链接失败`
            )
            done()
        }, 200)
    })
```
上面的例子比较有意思，因为在 `Jest` 中，我们没法真正触发图片的 `error` 和 `load` 事件，所以我使用了 `Object.defineProperty` 劫持了 `Image` 对象的 `src` 的 `set` 方法 ，根据不同的 `src` 值去主动触发图片的 `error` 或者 `load` 事件，这样使得了 `error` 和 `load` 可以触发，从而使得我们测试能够成功。

通过上述的一系列例子，我也得出一个结论：在单元测试中，就基本没有什么是不能模拟的，只要你能充分理解和使用各种模拟技术，基本就能解决90%以上的测试问题。

## 总结
经过一段时间的单元测试优化，我们的测试覆盖率，从 **62%** 提升到了 **82%**。我在团队内进行了线上的单元测试实践分享，大家也对单元测试有了新的理解和认识，对代码的单元测试也认真了起来，这也是我想看到的结果。一个项目的质量如何，稳不稳定，我觉得有一个比较重要的评判标准就是测试的覆盖率，没人愿意用一个没有测试的开源项目。

本文从模拟 `document.execCommand`、模拟 `XHR`、模拟用户交互、`jest.spyOn` 和 `Object.defineProperty` API 的使用的等方面介绍了模拟技术在 `wangEditor` 中的实践，目前来看，还是取得了不错的效果。当然，有些实践我也不好说一定是最佳实践，但是它确实解决了我们目前测试覆盖率低的困境。

展望未来，我们可以做的更好是，更好地将单元测试与 `E2E` 测试结合，相辅相成，组成 `wangEditor` 的质量保护网。部分测试还有很多可以优化的空间，除了前期的一些功能模块测试覆盖率不够理想外，一些用例也不太符合优秀单元测试的标准。这些，我们都会在未来的重构中，慢慢进行优化。
