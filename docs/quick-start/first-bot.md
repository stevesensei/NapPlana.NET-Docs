---
title: "第一个机器人"
editLink: true
---

# {{ $frontmatter.title }}

> どの仕事を始めますか、先生。
>
> 您想从什么工作开始？老师。
>
> ——Plana

## 先决条件

::: tip

请确保服务器防火墙对端口放行

:::

为了能够正常的进行接下来的步骤，请确保准备好了如下内容

- NapCat服务器，您需要知道如下信息

    - 创建`WebSocket服务器`网络配置
    
    - 服务器IP：可以被开发机访达的公网或内网IP

    - 端口：websocket通信端口

    - token：在创建WebSocket服务器时填写的令牌

    - 创建时消息格式请选择`array`

    - 打开`强制推送事件`

- 登录napcat的qq号

## 安装

创建一个控制台程序，保证其版本`>=.NET 6.0`

用你喜欢的方式安装软件包`NapPlana.NET`

nuget控制台
```
Install-Package NapPlana.NET
```

::: tip

项目依赖[TouchSokcet](https://touchsocket.net/)作为网络通信库，若你的项目之前有引用过，请保证其版本不低于`4.0.0-rc.5`

:::

## Coding Time!

### 创建机器人实例

框架使用一个工厂`BotFactory`来创建`NapBot`实例，支持链式写法，以下是创建方法

``` cs
using NapPlana.Core.Bot;
using NapPlana.Core.Data;

var bot = BotFactory.Create()
    .SetSelfId(123456) //机器人QQ号
    .SetConnectionType(BotConnectionType.WebSocketClient)//连接类型，目前只支持这种
    .SetIp("xxx.xxx.xxx.xxx") //服务器IP地址
    .SetPort(6700) //服务器端口
    .SetToken("your_bot_token_here") //机器人Token
    .Build();
```

此时你已经创建好了一个机器人实例，但是机器人还没正式连接到napcat服务器，我们先不着急，请继续看

### 订阅事件

框架内使用`BotEventHandler`这个静态类来管理机器人事件触发和订阅，我们可以先从一个简单的事件来下手

`OnLogReceived`是框架内的内置事件，可以通过订阅这个事件来接收框架内的日志

```csharp
//注册日志回调事件
BotEventHandler.OnLogReceived += (level, message) =>
{
    // 过滤掉Debug日志
    if (level == LogLevel.Debug)
    {
        return;
    }
    //可以接入自己的日志系统
    Console.WriteLine($"[{level}] {message}");
};
```
这样在机器人上线时或进行其他操作就会输出日志到控制台


::: warning

如果你在订阅事件后发现机器人反复进行某一事件，如当检测到`hello`发送的时候也回复一个`hello`你会发现机器人可能一直在发消息，这是因为`OnGroupMessageReceived`等事件在机器人自己发送了消息的时候也会触发，如果要使用类似的功能，请在一开头
```cs
//当检测到动作发出者的id和bot的id一致时返回
if (notice.UserId == bot.SelfId)
{
    return;
}

```

:::

### 发送Hello World!

此时我们的机器人实例就派上用场了,在此之前我们先介绍一下`MessageChainBuilder`，这是一个工厂，可以帮助你快速获取`List<MessageBase>`它可以添加很多类型的消息，但我们今天就只添加一个文字消息
```csharp
var hello = MessageChainBuilder.Create()
    .AddTextMessage("Hello, World!")
    .Build();
```

现在我们启动机器人实例

```cs
//启动机器人
await bot.StartAsync();
```

然后我们访问机器人实例，发送这条消息

```cs
//发送群消息
var result =  await bot.SendGroupMessageAsync(new GroupMessageSend()
   {
       GroupId = "123456789", //目标群号
       Message = hello
   });
```

控制台会有如下记录
```
[Info] 机器人已连接到NapCat服务器
[Info] 机器人连接至napcat...等待后续操作
```

这时请查看群聊

![1](/assets/first-bot-1.png)

### 百尺竿头

我们可以设计一个简单的功能：当群里有人说 hello的时候,机器人回复这个人的消息，并回答@该人，回答hi

你可能会好奇,发送消息时的`var result`是干啥的？

在不同的请求下它的类型不同，但在此处，他是一个`GroupMessageSendResponseData`，里面包含了这条消息的id，虽然我们在第一个机器人中用不到他，但其说明了一件事：每条消息都有它独属的id，由此我们可以来完成以上需求。

直接给出代码
```cs

BotEventHandler.OnGroupMessageReceived += async (messageEvent) =>
{
    //排除自己发的消息
    if (messageEvent.UserId == bot.SelfId)
    {
        return;
    }
    
    //检测消息内容是否包含特定关键词
    //之后这里会做出简化
    var isExist = messageEvent.Messages
        .Any(x => x is TextMessage { MessageData: TextMessageData data } && data.Text.Contains("hello"));
    //对于这个场景，还有个更好的方案，那就是使用RawMessage
    //isExist = messageEvent.RawMessage.Contains("hello");

    if (isExist)
    {
        //回复消息
        //注意:如要回复一条消息，那么这条消息链的第一条一定是reply message
        //由于napcat内部没有统一的问题？故这里需要做一些long到string的转换
        var replyMessage = MessageChainBuilder.Create()
            .AddReplyMessage(messageEvent.MessageId.ToString())
            .AddMentionMessage(messageEvent.UserId.ToString())
            .AddTextMessage(" hi")
            .Build();
        
        await bot.SendGroupMessageAsync(new GroupMessageSend()
        {
            GroupId = messageEvent.GroupId.ToString(),
            Message = replyMessage
        });
    }
};

```
效果如下

![2](/assets/first-bot-2.png)

这样，一个简单的问答机器人就做好了

### 更进一步

你已到达百尺竿头，只需更进一步

你可能发现你的控制台在运行结束后自动关闭了，这不是你想要的

所以，你选择在程序的最后将其卡住

```cs
var cts = new CancellationTokenSource();
Console.CancelKeyPress += async (s, e) =>
{
    e.Cancel = true;
    await bot.StopAsync();
    cts.Cancel();
};

try
{
    await Task.Delay(Timeout.Infinite, cts.Token);
}
catch (TaskCanceledException)
{

}
```

## 小结

根据以上的教程，你应该可以做一个简单的机器人了，接下来请浏览API文档，看看你能做出什么神奇的机器人吧 

> 肯定。老师我看好你哦
>
> —— Plana

## 完整代码
``` cs

using NapPlana.Core.Bot;
using NapPlana.Core.Data;
using NapPlana.Core.Data.API;
using NapPlana.Core.Data.Message;
using NapPlana.Core.Event.Handler;

var bot = BotFactory
    .Create()
    .SetSelfId(123456789)
    .SetConnectionType(BotConnectionType.WebSocketClient)
    .SetIp("xxxxxxx")
    .SetPort(6100)
    .SetToken("x")
    .Build();

//注册日志回调事件
BotEventHandler.OnLogReceived += (level, message) =>
{
    // 过滤掉Debug日志
    if (level == LogLevel.Debug)
    {
        return;
    }
    //可以接入自己的日志系统
    Console.WriteLine($"[{level}] {message}");
};

var hello = MessageChainBuilder.Create()
    .AddTextMessage("Hello, World!")
    .Build();
//启动机器人
await bot.StartAsync();

//发送群消息
var result =  await bot.SendGroupMessageAsync(new GroupMessageSend()
   {
       GroupId = "769372512", //目标群号
       Message = hello
   });


//更进一步

BotEventHandler.OnGroupMessageReceived += async (messageEvent) =>
{
    //排除自己发的消息
    if (messageEvent.UserId == bot.SelfId)
    {
        return;
    }
    
    //检测消息内容是否包含特定关键词
    //之后这里会做出简化
    var isExist = messageEvent.Messages
        .Any(x => x is TextMessage { MessageData: TextMessageData data } && data.Text.Contains("hello"));
    //对于这个场景，还有个更好的方案，那就是使用RawMessage
    //isExist = messageEvent.RawMessage.Contains("hello");

    if (isExist)
    {
        //回复消息
        //注意:如要回复一条消息，那么这条消息链的第一条一定是reply message
        //由于napcat内部没有统一的问题？故这里需要做一些long到string的转换
        var replyMessage = MessageChainBuilder.Create()
            .AddReplyMessage(messageEvent.MessageId.ToString())
            .AddMentionMessage(messageEvent.UserId.ToString())
            .AddTextMessage(" hi")
            .Build();
        
        await bot.SendGroupMessageAsync(new GroupMessageSend()
        {
            GroupId = messageEvent.GroupId.ToString(),
            Message = replyMessage
        });
    }
};

// Graceful shutdown on Ctrl+C
// Prevent the process from terminating immediately
var cts = new CancellationTokenSource();
Console.CancelKeyPress += async (s, e) =>
{
    e.Cancel = true;
    await bot.StopAsync();
    cts.Cancel();
};

try
{
    await Task.Delay(Timeout.Infinite, cts.Token);
}
catch (TaskCanceledException)
{

}
   
```

